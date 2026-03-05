const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: '*'
}));

app.use(express.json());

app.use('/api/auth',         require('./routes/auth.routes'));
app.use('/api/clients',      require('./routes/clients.routes'));
app.use('/api/vehicules',    require('./routes/vehicules.routes'));
app.use('/api/reservations', require('./routes/reservations.routes'));
app.use('/api/maintenances', require('./routes/maintenances.routes'));
app.use('/api/dashboard',    require('./routes/dashboard.routes'));
app.use('/api/ml',           require('./routes/ml.routes'));
app.use('/api/public',       require('./routes/public.routes'));

app.get('/', (req, res) => {
  res.json({ message: 'Smart ERP 4.0 — API operationnelle', version: '1.0.0' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('✅ Smart ERP 4.0 Backend demarre sur port ' + PORT);
});