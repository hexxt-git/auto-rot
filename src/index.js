import express from 'express';
import { generateShort } from './generator.js';

const app = new express();
app.use(express.json());

app.post('/', (req, res) => {
	const topic = req.body.topic;
	const outro = req.body.outro;

	if (topic == null || outro == null) {
		res.status(400);
		res.json('topic or task not found in req body');
		return 0;
	}

	const id = Math.floor(Math.random() * 1e12);

	generateShort(id, topic, outro);

	return res.json({ id });
});

app.get('/status', (req, res) => {
	res.status('400');
	return res.json('check status using /status/{id}');
});
app.get('/status/:id', (req, res) => {
	const id = req.params.id;
    // TODO: return vid generation status
	return res.json({ id });
});

app.listen(5000, () => {
	console.log('app started at http://localhost:5000');
});
