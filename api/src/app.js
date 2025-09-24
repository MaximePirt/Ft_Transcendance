const express = require('express');
const app = express();


app.use(express.json());

app.get('/', (req, res) => {
  res.send('API Ft_Transcendance fonctionne !');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);
