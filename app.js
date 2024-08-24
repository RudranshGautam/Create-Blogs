const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const app = express();

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'rudransh@1', // Your MySQL password
    database: 'blogDB'
});

db.connect(err => {
    if (err) throw err;
    console.log('MySQL connected...');
});

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Route to render the main page (create and display blog posts)
app.get('/', (req, res) => {
    const query = `
        SELECT blogs.id, blogs.title, blogs.author, blogs.content, comments.comment
        FROM blogs
        LEFT JOIN comments ON blogs.id = comments.blog_id
    `;
    
    db.query(query, (err, results) => {
        if (err) throw err;

        // Group comments by blog ID
        const blogs = results.reduce((acc, row) => {
            const blogId = row.id;
            if (!acc[blogId]) {
                acc[blogId] = {
                    id: blogId,
                    title: row.title,
                    author: row.author,
                    content: row.content,
                    comments: []
                };
            }
            if (row.comment) {
                acc[blogId].comments.push({ comment: row.comment });
            }
            return acc;
        }, {});

        // Convert object to array
        res.render('index', { blogs: Object.values(blogs) });
    });
});

// Route to handle blog post submission
app.post('/create', (req, res) => {
    const { title, author, content } = req.body;
    const query = 'INSERT INTO blogs (title, author, content) VALUES (?, ?, ?)';
    db.query(query, [title, author, content], (err, result) => {
        if (err) throw err;
        res.redirect('/');
    });
});

// Route to handle comment submission
app.post('/comment/:id', (req, res) => {
    const { comment } = req.body;
    const query = 'INSERT INTO comments (blog_id, comment) VALUES (?, ?)';
    db.query(query, [req.params.id, comment], (err, result) => {
        if (err) throw err;
        res.redirect('/');
    });
});

// Route to delete a blog post and its comments
app.post('/delete/:id', (req, res) => {
    const deleteCommentsQuery = 'DELETE FROM comments WHERE blog_id = ?';
    db.query(deleteCommentsQuery, [req.params.id], (err, result) => {
        if (err) throw err;

        const deleteBlogQuery = 'DELETE FROM blogs WHERE id = ?';
        db.query(deleteBlogQuery, [req.params.id], (err, result) => {
            if (err) throw err;
            res.redirect('/');
        });
    });
});

// Start the server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
