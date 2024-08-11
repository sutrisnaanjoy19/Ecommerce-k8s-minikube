import React, { useEffect, useState } from "react";

const BACKEND_HOSTNAME =
  process.env.REACT_APP_BACKEND_HOSTNAME || "localhost:5000";

function App() {
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    console.log(process.env.NODE_ENV === "production");
    // Fetch products from the backend API
    fetch(`http://${BACKEND_HOSTNAME}/api/products`)
      .then((response) => response.json())
      .then((data) => setProducts(data));
  }, []);

  const placeOrder = (productId) => {
    fetch(`http://${BACKEND_HOSTNAME}/api/order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ productId }),
    })
      .then((response) => response.json())
      .then((data) => setMessage(data.message));
  };

  return (
    <div className="App">
      <h1>Product List</h1>
      <ul>
        {products.map((product) => (
          <li key={product.id}>
            {product.name} - ${product.price}
            <button onClick={() => placeOrder(product.id)}>Buy Now</button>
          </li>
        ))}
      </ul>
      {message && <p>{message}</p>}
    </div>
  );
}

export default App;
