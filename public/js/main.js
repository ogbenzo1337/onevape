let cart = [];

function addToCart(item) {
  cart.push(item);
  updateCart();
}

function updateCart() {
  const cartElement = document.getElementById('cart');
  cartElement.innerHTML = '';

  let total = 0;
  cart.forEach(item => {
    total += item.price;
    const itemElement = document.createElement('div');
    itemElement.innerText = `${item.name} - $${item.price.toFixed(2)}`;
    cartElement.appendChild(itemElement);
  });

  const totalElement = document.createElement('div');
  totalElement.innerText = `Razem: $${total.toFixed(2)}`;
  cartElement.appendChild(totalElement);

  if (cart.length > 0) {
    document.getElementById('paypal-button-container').style.display = 'block';
  } else {
    document.getElementById('paypal-button-container').style.display = 'none';
  }

  // Integracja z PayPal
  paypal.Buttons({
    createOrder: function (data, actions) {
      return actions.order.create({
        purchase_units: [{
          amount: {
            value: total.toFixed(2)
          }
        }]
      });
    },
    onApprove: function (data, actions) {
      return actions.order.capture().then(function (details) {
        // Wysyłanie danych zamówienia na serwer
        fetch('/order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            orderId: Math.floor(Math.random() * 1000000000),
            items: cart,
            total: total.toFixed(2),
            paymentDetails: details
          })
        }).then(response => {
          if (response.ok) {
            window.location.href = `/success?orderId=${details.id}`;
          } else {
            window.location.href = '/error';
          }
        });
      });
    }
  }).render('#paypal-button-container');
}
