const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
app.use(bodyParser.json());

let articles = [];

const loadArticles = () => {
  if (fs.existsSync('articles.json')) {
    articles = JSON.parse(fs.readFileSync('articles.json', 'utf-8'));
  }
};
loadArticles();

const saveArticles = () => {
  fs.writeFileSync('articles.json', JSON.stringify(articles, null, 2));
};

const calculateRelevance = (content, keyword) => {
  const matches = content.toLowerCase().split(keyword.toLowerCase()).length - 1;
  return matches;
};

app.post('/articles', (req, res) => {
  const { title, content, tags } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const id = articles.length + 1;
  const newArticle = { id, title, content, tags: tags || [], date: new Date() };
  articles.push(newArticle);

  saveArticles(); 
  res.status(201).json({ message: 'Article added!', article: newArticle });
});

app.get('/articles/search', (req, res) => {
  const { keyword, tag, sortBy = 'relevance' } = req.query;

  let results = articles.filter(article => {
    const matchesKeyword = keyword
      ? article.title.toLowerCase().includes(keyword.toLowerCase()) ||
        article.content.toLowerCase().includes(keyword.toLowerCase())
      : true;
    const matchesTag = tag ? article.tags.includes(tag) : true;
    return matchesKeyword && matchesTag;
  });

  if (sortBy === 'relevance' && keyword) {
    results = results.sort((a, b) => {
      const relevanceA = calculateRelevance(a.title + ' ' + a.content, keyword);
      const relevanceB = calculateRelevance(b.title + ' ' + b.content, keyword);
      return relevanceB - relevanceA;
    });
  } else if (sortBy === 'date') {
    results = results.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  res.json({ results });
});


app.get('/articles/:id', (req, res) => {
  const article = articles.find(a => a.id === parseInt(req.params.id));
  if (!article) {
    return res.status(404).json({ error: 'Article not found' });
  }
  res.json({ article });
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
