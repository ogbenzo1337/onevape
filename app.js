const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Konfiguracja sesji
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Pliki danych
const ordersFile = 'orders.json';
const adminFile = 'admin.json';

// Middleware do sprawdzania, czy użytkownik jest zalogowany
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
}

// Funkcja do odczytu zamówień z pliku
function readOrders() {
  if (!fs.existsSync(ordersFile)) return [];
  const data = fs.readFileSync(ordersFile);
  return JSON.parse(data);
}

// Funkcja do zapisu zamówień do pliku
function writeOrders(orders) {
  fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
}

// Strona główna
app.get('/', (req, res) => {
  res.render('index');
});

// Strona logowania
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (fs.existsSync(adminFile)) {
    const adminData = JSON.parse(fs.readFileSync(adminFile));

    if (adminData.username === username) {
      bcrypt.compare(password, adminData.password, (err, match) => {
        if (match) {
          req.session.user = username;
          return res.redirect('/admin/orders');
        } else {
          return res.redirect('/login');
        }
      });
    } else {
      return res.redirect('/login');
    }
  } else {
    return res.redirect('/login');
  }
});

// Strona sukcesu zamówienia
app.get('/success', (req, res) => {
  const orderId = req.query.orderId;
  res.render('success', { orderId });
});

// Strona błędu
app.get('/error', (req, res) => {
  res.render('error');
});

// Endpoint do obsługi zamówienia
app.post('/order', (req, res) => {
  const orders = readOrders();
  const newOrder = {
    orderId: req.body.orderId,
    items: req.body.items,
    total: req.body.total,
    paymentDetails: req.body.paymentDetails,
    date: new Date()
  };

  orders.push(newOrder);
  writeOrders(orders);

  res.status(200).send('Order saved successfully');
});

// Panel admina - zarządzanie zamówieniami (dostęp po zalogowaniu)
app.get('/admin/orders', isAuthenticated, (req, res) => {
  const orders = readOrders();
  res.render('admin_orders', { orders });
});

// Wylogowanie
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// Dodanie konta admina (jednorazowe uruchomienie)
app.get('/create-admin', async (req, res) => {
  const hashedPassword = await bcrypt.hash('adminpassword', 10);
  const adminData = {
    username: 'admin',
    password: hashedPassword
  };

  fs.writeFileSync(adminFile, JSON.stringify(adminData, null, 2));
  res.send('Admin created');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
