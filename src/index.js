import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { generateShort } from './generator.js';
import fs from 'fs/promises';
import path from 'path';
import process from 'process';
import crypto from 'crypto';

const app = express();
app.use(express.json());

let db;

async function initializeDatabase() {
	db = await open({
		filename: './database.sqlite',
		driver: sqlite3.Database,
	});

	await db.exec(`
        CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY,
        topic TEXT,
        outro TEXT,
        channel_description TEXT,
        status TEXT DEFAULT 'pending',
        progress INTEGER DEFAULT 0
        )
    `);
}

async function cleanup() {
	await db.exec(`
        DELETE FROM videos WHERE status = 'pending'
    `);

	await fs.rm(path.join(process.cwd(), '/tmp'), { recursive: true, force: true });
	await fs.mkdir(path.join(process.cwd(), '/tmp'), { recursive: true });

	const outputDir = path.join(process.cwd(), '/output');
	const videoFiles = await fs.readdir(outputDir);

	const doneEntries = await db.all(`SELECT id FROM videos WHERE status = 'done'`);

	const existingFileIds = new Set(
		videoFiles
			.map((file) => {
				const match = file.match(/^video_(\d+)\.mp4$/);
				return match ? match[1] : null;
			})
			.filter((id) => id !== null)
	);

	for (const entry of doneEntries) {
		if (!existingFileIds.has(entry.id.toString())) {
			console.log(`Deleting database entry for missing file: video_${entry.id}.mp4`);
			await db.run(`DELETE FROM videos WHERE id = ?`, [entry.id]);
		}
	}

	for (const file of videoFiles) {
		const match = file.match(/^video_(\d+)\.mp4$/);
		if (match) {
			const id = match[1];
			const dbEntry = await db.get(`SELECT * FROM videos WHERE id = ?`, [id]);
			if (!dbEntry) {
				console.log(`Deleting file not found in database: ${file}`);
				await fs.unlink(path.join(outputDir, file));
			}
		} else {
			console.log(`Deleting file with invalid name format: ${file}`);
			await fs.unlink(path.join(outputDir, file));
		}
	}
}

async function updateVideoStatus(id, status, progress) {
	try {
		await db.run('UPDATE videos SET status = ?, progress = ? WHERE id = ?', [status, progress, id]);
	} catch (error) {
		console.error('Error updating video status:', error);
	}
}

app.get('/', (req, res) => {
	res.json({
		message: 'Welcome to the Short Video Generation API',
		endpoints: {
			'POST /': 'Create a new video generation request',
			'GET /status/:id': 'Check the status of a video generation request',
		},
	});
});

app.post('/', async (req, res) => {
	const { topic, outro, channel_description } = req.body;

	if (!topic || !outro || !channel_description) {
		return res.status(400).json({ error: 'Topic, outro, and channel description are required' });
	}

	const id = crypto.randomInt(0, 281474976710650);

	res.json({ id });

	try {
		await db.run('INSERT INTO videos (id, topic, outro, channel_description) VALUES (?, ?, ?, ?)', [
			id,
			topic,
			outro,
			channel_description,
		]);

		const updateFunction = (status, progress) => {
			updateVideoStatus(id, status, progress);
		};

		await generateShort(id, topic, outro, channel_description, updateFunction);
	} catch (error) {
		console.error('Error creating video:', error);
	}
});

app.get('/status/', async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const offset = (page - 1) * limit;

		if (limit > 100) {
			return res.status(400).send('max limit is 100');
		}

		const [videos, totalCount] = await Promise.all([
			db.all('SELECT * FROM videos LIMIT ? OFFSET ?', [limit, offset]),
			db.get('SELECT COUNT(*) as count FROM videos'),
		]);

		const totalPages = Math.ceil(totalCount.count / limit);

		res.json({
			videos,
			currentPage: page,
			totalPages,
			totalVideos: totalCount.count,
		});
	} catch (error) {
		console.error('error fetching videos', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

app.get('/status/:id', async (req, res) => {
	const { id } = req.params;

	try {
		const video = await db.get('SELECT * FROM videos WHERE id = ?', id);
		if (video) {
			res.json({
				id: video.id,
				status: video.status,
				progress: video.progress,
				topic: video.topic,
				channel_description: video.channel_description,
			});
		} else {
			res.status(404).json({ error: 'Video not found' });
		}
	} catch (error) {
		console.error('Error fetching video status:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

app.use((req, res) => {
	res.status(404).json({ error: 'Not found' });
});

async function startServer() {
	await initializeDatabase();
	await cleanup();
	app.listen(5000, () => {
		console.log('App started at http://localhost:5000');
	});
}

startServer().catch(console.error);
