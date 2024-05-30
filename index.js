import express from 'express';
import bodyParser from 'body-parser';
import pg from 'pg';
import env from 'dotenv';
// import { parse } from 'path';

const app = express();
const port = 3000;
env.config();

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect(err => {
    if (err) {
      console.error(err);
    } else {
      console.log('Connected to the database');
    }
});

app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());
// app.set('view engine', 'ejs');


app.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM posts ORDER BY date DESC');
        res.render("index.ejs", {
            posts: result.rows,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching posts');
    }
});

app.get('/post.ejs', (req, res) => {
    res.render("post.ejs");
});

app.post('/posts', async (req, res) => {
    const {title, author, content } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO posts (title, author, content, date) VALUES ($1, $2, $3, $4) RETURNING id',
            [title, author, content, new Date()]
        );
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error creating post');
    }
});

app.get('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const result = await db.query('SELECT * FROM posts WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).send('Post not found');
        }
        res.render("post.ejs", {
            post: result.rows[0],
        });
    } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching post');
    }
});

app.post('/posts/:id', async (req, res) => {

    const id = parseInt(req.params.id);
    const { title, author, content } = req.body;
    try {
        await db.query(
            'UPDATE posts SET title = $1, author = $2, content = $3, date = $4 WHERE id = $5',
            [title, author, content, new Date(), id]
        );
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating post');
    }
});

app.get('/delete/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const result = await db.query('DELETE FROM posts WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).send('Post not found');
        }
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting post');
    }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}.`);
});