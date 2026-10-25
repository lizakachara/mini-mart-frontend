import React, { createContext, useState } from "react";

export const CartContext = createContext();

function CartProvider({ children }) {
const [cartItems, setCartItems] = useState([]);

// GET A UNIQUE PRODUCT IDENTIFIER
const getProductKey = (product) =>
String(product._id || product.id || product.name);

// ADD PRODUCT TO CART
const addToCart = (product) => {
setCartItems((oldItems) => {
const productKey = getProductKey(product);

 
  const requestedQuantity = Math.max(
    1,
    Number(product.quantity) || 1
  );

  const existingProduct = oldItems.find(
    (item) => getProductKey(item) === productKey
  );

  if (existingProduct) {
    return oldItems.map((item) =>
      getProductKey(item) === productKey
        ? {
            ...item,
            quantity:
              (Number(item.quantity) || 1) +
              requestedQuantity,
          }
        : item
    );
  }

  return [
    ...oldItems,
    {
      ...product,
      quantity: requestedQuantity,
    },
  ];
});
 

};

// REMOVE PRODUCT FROM CART
const removeFromCart = (productKey) => {
setCartItems((oldItems) =>
oldItems.filter(
(item) => getProductKey(item) !== String(productKey)
)
);
};

// INCREASE PRODUCT QUANTITY
const increaseQuantity = (productKey) => {
setCartItems((oldItems) =>
oldItems.map((item) => {
if (getProductKey(item) !== String(productKey)) {
return item;
}

 
    const currentQuantity = Number(item.quantity) || 1;
    const stock =
      item.stock === undefined || item.stock === null
        ? Infinity
        : Number(item.stock);

    if (currentQuantity >= stock) {
      return item;
    }

    return {
      ...item,
      quantity: currentQuantity + 1,
    };
  })
);
 

};

// DECREASE PRODUCT QUANTITY
const decreaseQuantity = (productKey) => {
setCartItems((oldItems) =>
oldItems.map((item) => {
if (getProductKey(item) !== String(productKey)) {
return item;
}

 
    const currentQuantity = Number(item.quantity) || 1;

    if (currentQuantity <= 1) {
      return item;
    }

    return {
      ...item,
      quantity: currentQuantity - 1,
    };
  })
);
 

};
const clearCart = () => {
  setCartItems([]);
};

return (
<CartContext.Provider

value={{
  cartItems,
  addToCart,
  removeFromCart,
  increaseQuantity,
  decreaseQuantity,
  clearCart,
}}
>
{children}
</CartContext.Provider>
);
}

export default CartProvider;
