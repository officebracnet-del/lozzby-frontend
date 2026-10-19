import { useEffect, useState } from "react";

/* =========================================================
   DEPLOYED BACKEND
========================================================= */

const API = "https://daily-drop-backend-xkkc.onrender.com";


/* =========================================================
   OPTIONS
========================================================= */

const categories = [
  "Electronics",
  "Fashion",
  "Mobile Accessories",
  "Home & Living",
  "Beauty",
  "Groceries",
  "Sports",
  "Automotive",
];

const sections = [
  "Featured",
  "Trending",
  "Flash Sale",
  "Daily Drop",
];

const statuses = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];


/* =========================================================
   MAIN ADMIN PANEL
========================================================= */

export default function AdminPanel() {

  /* =======================================================
     LOGIN
  ======================================================= */

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [token, setToken] = useState(
    () => localStorage.getItem("admin_token") || ""
  );

  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");


  /* =======================================================
     PRODUCTS
  ======================================================= */

  const [products, setProducts] = useState([]);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");

  const [category, setCategory] =
    useState("Electronics");

  const [section, setSection] =
    useState("Featured");

  const [search, setSearch] = useState("");

  const [loadingProducts, setLoadingProducts] =
    useState(false);

  const [addingProduct, setAddingProduct] =
    useState(false);

  const [deletingProduct, setDeletingProduct] =
    useState("");


  /* =======================================================
     ORDERS
  ======================================================= */

  const [orders, setOrders] = useState([]);

  const [orderSearch, setOrderSearch] =
    useState("");

  const [loadingOrders, setLoadingOrders] =
    useState(false);

  const [updatingOrder, setUpdatingOrder] =
    useState("");

  const [deletingOrder, setDeletingOrder] =
    useState("");


  /* =======================================================
     HELPERS
  ======================================================= */

  const getProductId = (product) => {
    if (!product) return "";

    return String(
      product.id ||
      product._id ||
      product.product_id ||
      ""
    );
  };


  const getOrderId = (order) => {
    if (!order) return "";

    return String(
      order.id ||
      order._id ||
      order.order_id ||
      ""
    );
  };


  /* =======================================================
     LOGOUT
  ======================================================= */

  function logout() {

    localStorage.removeItem("admin_token");

    /*
      Remove old token too.
      This prevents an old broken login token
      from causing problems.
    */

    localStorage.removeItem("token");

    setToken("");

    setProducts([]);

    setOrders([]);

    setUsername("");

    setPassword("");

    setLoginError("");
  }


  /* =======================================================
     LOAD PRODUCTS
  ======================================================= */

  const loadProducts = async () => {

    try {

      setLoadingProducts(true);

      const res = await fetch(
        `${API}/products`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      let data = {};

      try {
        data = await res.json();
      } catch {
        data = {};
      }

      console.log(
        "PRODUCT RESPONSE:",
        data
      );

      if (!res.ok) {

        throw new Error(
          data?.detail ||
          data?.message ||
          "Products loading failed"
        );
      }

      if (!Array.isArray(data)) {

        throw new Error(
          "Products API did not return an array"
        );
      }

      setProducts(data);

    } catch (error) {

      console.error(
        "PRODUCT LOAD ERROR:",
        error
      );

      setProducts([]);

    } finally {

      setLoadingProducts(false);
    }
  };


  /* =======================================================
     LOAD ORDERS
  ======================================================= */

  const loadOrders = async () => {

    if (!token) return;

    try {

      setLoadingOrders(true);

      const res = await fetch(
        `${API}/orders`,
        {
          method: "GET",

          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      let data = {};

      try {
        data = await res.json();
      } catch {
        data = {};
      }

      console.log(
        "ORDER RESPONSE:",
        data
      );

      if (
        res.status === 401 ||
        res.status === 403
      ) {

        logout();

        return;
      }

      if (!res.ok) {

        throw new Error(
          data?.detail ||
          data?.message ||
          "Orders loading failed"
        );
      }

      if (!Array.isArray(data)) {

        throw new Error(
          "Orders API did not return an array"
        );
      }

      setOrders(data);

    } catch (error) {

      console.error(
        "ORDER LOAD ERROR:",
        error
      );

      setOrders([]);

    } finally {

      setLoadingOrders(false);
    }
  };


  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {

    if (!token) return;

    loadProducts();
    loadOrders();

  }, [token]);


  /* =======================================================
     LOGIN
  ======================================================= */

  const login = async () => {

    setLoginError("");

    if (!username.trim()) {

      setLoginError(
        "Username is required."
      );

      return;
    }

    if (!password) {

      setLoginError(
        "Password is required."
      );

      return;
    }

    try {

      setLoginLoading(true);

      console.log(
        "LOGIN URL:",
        `${API}/admin/login`
      );

      const res = await fetch(
        `${API}/admin/login`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body: JSON.stringify({
            username:
              username.trim(),

            password:
              password,
          }),
        }
      );

      let data = {};

      try {

        data = await res.json();

      } catch {

        data = {};
      }

      console.log(
        "LOGIN RESPONSE:",
        data
      );

      if (!res.ok) {

        setLoginError(
          data?.detail ||
          data?.message ||
          `Login failed (${res.status})`
        );

        return;
      }

      if (!data?.token) {

        setLoginError(
          "Backend login response-এ token পাওয়া যায়নি."
        );

        return;
      }

      /*
        Save token using a dedicated key.
      */

      localStorage.setItem(
        "admin_token",
        data.token
      );

      /*
        Remove old token if there is one.
      */

      localStorage.removeItem("token");

      setToken(data.token);

      setPassword("");

      setLoginError("");

      alert(
        "Login Successful!"
      );

    } catch (error) {

      console.error(
        "LOGIN ERROR:",
        error
      );

      setLoginError(
        "Backend-এর সাথে connect করা যাচ্ছে না.\n\n" +
        "Backend:\n" +
        API
      );

    } finally {

      setLoginLoading(false);
    }
  };


  /* =======================================================
     IMAGE SELECT
  ======================================================= */

  const selectImage = (e) => {

    const file =
      e.target.files?.[0];

    if (!file) return;

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {

      alert(
        "Please select an image file."
      );

      e.target.value = "";

      return;
    }

    if (
      file.size >
      2 * 1024 * 1024
    ) {

      alert(
        "Image must be less than 2MB."
      );

      e.target.value = "";

      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {

      setImage(
        String(
          reader.result || ""
        )
      );
    };

    reader.onerror = () => {

      alert(
        "Could not read the image."
      );
    };

    reader.readAsDataURL(file);
  };


  /* =======================================================
     ADD PRODUCT
  ======================================================= */

  const addProduct = async () => {

    if (!name.trim()) {

      alert(
        "Product name is required."
      );

      return;
    }

    if (
      price === "" ||
      Number(price) <= 0
    ) {

      alert(
        "Please enter a valid price."
      );

      return;
    }

    if (!token) {

      alert(
        "Please login again."
      );

      return;
    }

    try {

      setAddingProduct(true);

      const res = await fetch(
        `${API}/products`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({

            name:
              name.trim(),

            price:
              Number(price),

            image:
              image || "",

            category:
              category,

            section:
              section,
          }),
        }
      );

      let data = {};

      try {

        data = await res.json();

      } catch {

        data = {};
      }

      console.log(
        "ADD PRODUCT RESPONSE:",
        data
      );

      if (
        res.status === 401 ||
        res.status === 403
      ) {

        logout();

        alert(
          "Session expired. Please login again."
        );

        return;
      }

      if (!res.ok) {

        alert(
          data?.detail ||
          data?.message ||
          "Product add failed."
        );

        return;
      }

      setName("");
      setPrice("");
      setImage("");

      setCategory(
        "Electronics"
      );

      setSection(
        "Featured"
      );

      await loadProducts();

      alert(
        "Product Added Successfully!"
      );

    } catch (error) {

      console.error(
        "ADD PRODUCT ERROR:",
        error
      );

      alert(
        "Cannot connect to backend."
      );

    } finally {

      setAddingProduct(false);
    }
  };


  /* =======================================================
     DELETE PRODUCT
  ======================================================= */

  const deleteProduct = async (
    productId,
    productName
  ) => {

    if (!productId) {

      alert(
        "Product ID not found."
      );

      return;
    }

    if (!token) {

      alert(
        "Please login again."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${productName || "this product"}"?`
      );

    if (!confirmed) return;

    try {

      setDeletingProduct(
        String(productId)
      );

      const res = await fetch(
        `${API}/products/${encodeURIComponent(
          String(productId)
        )}`,
        {
          method: "DELETE",

          headers: {
            Accept:
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      let data = {};

      try {

        data = await res.json();

      } catch {

        data = {};
      }

      console.log(
        "DELETE PRODUCT RESPONSE:",
        data
      );

      if (
        res.status === 401 ||
        res.status === 403
      ) {

        logout();

        alert(
          "Session expired. Please login again."
        );

        return;
      }

      if (!res.ok) {

        alert(
          data?.detail ||
          data?.message ||
          "Product delete failed."
        );

        return;
      }

      setProducts(
        previous =>
          previous.filter(
            product =>
              getProductId(product) !==
              String(productId)
          )
      );

      alert(
        "Product Deleted Successfully!"
      );

    } catch (error) {

      console.error(
        "DELETE PRODUCT ERROR:",
        error
      );

      alert(
        "Cannot connect to backend."
      );

    } finally {

      setDeletingProduct("");
    }
  };


  /* =======================================================
     UPDATE ORDER STATUS
  ======================================================= */

  const updateOrderStatus = async (
    orderId,
    newStatus
  ) => {

    if (!orderId) {

      alert(
        "Order ID not found."
      );

      return;
    }

    if (!token) {

      alert(
        "Please login again."
      );

      return;
    }

    try {

      setUpdatingOrder(
        String(orderId)
      );

      const res = await fetch(
        `${API}/orders/${encodeURIComponent(
          String(orderId)
        )}/status`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            status:
              newStatus,
          }),
        }
      );

      let data = {};

      try {

        data = await res.json();

      } catch {

        data = {};
      }

      console.log(
        "UPDATE ORDER RESPONSE:",
        data
      );

      if (
        res.status === 401 ||
        res.status === 403
      ) {

        logout();

        alert(
          "Session expired. Please login again."
        );

        return;
      }

      if (!res.ok) {

        alert(
          data?.detail ||
          data?.message ||
          "Status update failed."
        );

        return;
      }

      setOrders(
        previousOrders =>
          previousOrders.map(
            order =>
              getOrderId(order) ===
              String(orderId)
                ? {
                    ...order,
                    status:
                      newStatus,
                  }
                : order
          )
      );

      alert(
        `Order status changed to "${newStatus}".`
      );

    } catch (error) {

      console.error(
        "UPDATE ORDER ERROR:",
        error
      );

      alert(
        "Cannot connect to backend."
      );

    } finally {

      setUpdatingOrder("");
    }
  };


  /* =======================================================
     DELETE ORDER
  ======================================================= */

  const deleteOrder = async (
    orderId
  ) => {

    if (!orderId) {

      alert(
        "Order ID not found."
      );

      return;
    }

    if (!token) {

      alert(
        "Please login again."
      );

      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this order?"
      );

    if (!confirmed) return;

    try {

      setDeletingOrder(
        String(orderId)
      );

      const res = await fetch(
        `${API}/orders/${encodeURIComponent(
          String(orderId)
        )}`,
        {
          method: "DELETE",

          headers: {
            Accept:
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      let data = {};

      try {

        data = await res.json();

      } catch {

        data = {};
      }

      console.log(
        "DELETE ORDER RESPONSE:",
        data
      );

      if (
        res.status === 401 ||
        res.status === 403
      ) {

        logout();

        alert(
          "Session expired. Please login again."
        );

        return;
      }

      if (!res.ok) {

        alert(
          data?.detail ||
          data?.message ||
          "Order delete failed."
        );

        return;
      }

      setOrders(
        previousOrders =>
          previousOrders.filter(
            order =>
              getOrderId(order) !==
              String(orderId)
          )
      );

      alert(
        "Order Deleted Successfully!"
      );

    } catch (error) {

      console.error(
        "DELETE ORDER ERROR:",
        error
      );

      alert(
        "Cannot connect to backend."
      );

    } finally {

      setDeletingOrder("");
    }
  };


  /* =======================================================
     FILTER PRODUCTS
  ======================================================= */

  const filteredProducts =
    products.filter(
      product => {

        const text = `
          ${product?.name || ""}
          ${product?.category || ""}
          ${product?.section || ""}
          ${product?.price || ""}
          ${getProductId(product)}
        `.toLowerCase();

        return text.includes(
          search.toLowerCase()
        );
      }
    );


  /* =======================================================
     FILTER ORDERS
  ======================================================= */

  const filteredOrders =
    orders.filter(
      order => {

        const itemText =
          (order?.items || [])
            .map(
              item => `
                ${item?.name || ""}
                ${item?.product_id || ""}
                ${item?.id || ""}
                ${item?._id || ""}
              `
            )
            .join(" ");

        const text = `
          ${order?.customer_name || ""}
          ${order?.phone || ""}
          ${order?.address || ""}
          ${order?.payment_method || ""}
          ${order?.status || ""}
          ${getOrderId(order)}
          ${itemText}
        `.toLowerCase();

        return text.includes(
          orderSearch.toLowerCase()
        );
      }
    );


  /* =======================================================
     LOGIN PAGE
  ======================================================= */

  if (!token) {

    return (
      <div style={loginPage}>

        <div style={loginCard}>

          <div style={logoCircle}>
            🛍️
          </div>

          <h1 style={loginTitle}>
            Lozzby Admin
          </h1>

          <p style={loginSubtitle}>
            Manage your store professionally
          </p>

          <input
            style={inputStyle}
            placeholder="Username"
            value={username}
            onChange={
              e =>
                setUsername(
                  e.target.value
                )
            }
            disabled={
              loginLoading
            }
          />

          <input
            style={inputStyle}
            type="password"
            placeholder="Password"
            value={password}
            onChange={
              e =>
                setPassword(
                  e.target.value
                )
            }
            onKeyDown={
              e => {

                if (
                  e.key === "Enter"
                ) {

                  login();
                }
              }
            }
            disabled={
              loginLoading
            }
          />

          {loginError && (
            <div
              style={loginErrorStyle}
            >
              {loginError}
            </div>
          )}

          <button
            style={primaryButton}
            onClick={login}
            disabled={
              loginLoading
            }
          >
            {loginLoading
              ? "Connecting..."
              : "🔐 Login"}
          </button>

          <div
            style={backendInfo}
          >
            Backend connected to:
            <br />
            <strong>
              daily-drop-backend-xkkc.onrender.com
            </strong>
          </div>

        </div>

      </div>
    );
  }


  /* =======================================================
     DASHBOARD
  ======================================================= */

  return (
    <div style={page}>

      <div style={container}>

        {/* HEADER */}

        <div style={headerCard}>

          <div>

            <div style={smallBadge}>
              LOZZBY ADMIN
            </div>

            <h1 style={headerTitle}>
              Dashboard
            </h1>

            <p style={headerSubtitle}>
              Manage products, orders and your store
            </p>

          </div>

          <button
            onClick={logout}
            style={logoutButton}
          >
            Logout
          </button>

        </div>


        {/* STATS */}

        <div style={statsGrid}>

          <StatCard
            icon="📦"
            title="Products"
            value={
              products.length
            }
          />

          <StatCard
            icon="✨"
            title="Daily Drop"
            value={
              products.filter(
                product =>
                  String(
                    product?.section ||
                    ""
                  ).toLowerCase() ===
                  "daily drop"
              ).length
            }
          />

          <StatCard
            icon="🛒"
            title="Orders"
            value={
              orders.length
            }
          />

          <StatCard
            icon="⏳"
            title="Pending"
            value={
              orders.filter(
                order =>
                  (
                    order?.status ||
                    "Pending"
                  ) ===
                  "Pending"
              ).length
            }
          />

          <StatCard
            icon="✅"
            title="Delivered"
            value={
              orders.filter(
                order =>
                  order?.status ===
                  "Delivered"
              ).length
            }
          />

        </div>


        {/* =================================================
            ADD PRODUCT
        ================================================= */}

        <div style={cardStyle}>

          <div style={sectionHeader}>

            <div>

              <h2 style={sectionTitle}>
                ➕ Add New Product
              </h2>

              <p style={mutedText}>
                Add products to your Lozzby store.
              </p>

            </div>

          </div>


          <div style={formGrid}>

            <div>

              <label style={labelStyle}>
                Product Name
              </label>

              <input
                style={inputStyle}
                placeholder="Enter product name"
                value={name}
                onChange={
                  e =>
                    setName(
                      e.target.value
                    )
                }
                disabled={
                  addingProduct
                }
              />

            </div>


            <div>

              <label style={labelStyle}>
                Price
              </label>

              <input
                style={inputStyle}
                type="number"
                min="0"
                placeholder="Enter price"
                value={price}
                onChange={
                  e =>
                    setPrice(
                      e.target.value
                    )
                }
                disabled={
                  addingProduct
                }
              />

            </div>


            <div>

              <label style={labelStyle}>
                Category
              </label>

              <select
                style={inputStyle}
                value={category}
                onChange={
                  e =>
                    setCategory(
                      e.target.value
                    )
                }
                disabled={
                  addingProduct
                }
              >

                {categories.map(
                  item => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}

              </select>

            </div>


            <div>

              <label style={labelStyle}>
                Website Section
              </label>

              <select
                style={inputStyle}
                value={section}
                onChange={
                  e =>
                    setSection(
                      e.target.value
                    )
                }
                disabled={
                  addingProduct
                }
              >

                {sections.map(
                  item => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}

              </select>

            </div>

          </div>


          <label style={labelStyle}>
            Product Image
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={selectImage}
            style={fileInput}
            disabled={
              addingProduct
            }
          />


          {image && (

            <div style={previewBox}>

              <img
                src={image}
                alt="Preview"
                style={previewImage}
              />

              <button
                onClick={
                  () =>
                    setImage("")
                }
                style={
                  removeImageButton
                }
              >
                Remove Image
              </button>

            </div>

          )}


          <button
            style={primaryButton}
            onClick={addProduct}
            disabled={
              addingProduct
            }
          >
            {addingProduct
              ? "Adding Product..."
              : "➕ Add Product"}
          </button>

        </div>


        {/* =================================================
            PRODUCTS
        ================================================= */}

        <div style={cardStyle}>

          <div style={sectionHeader}>

            <div>

              <h2 style={sectionTitle}>
                📦 Products
              </h2>

              <p style={mutedText}>
                {filteredProducts.length}
                {" "}
                products found
              </p>

            </div>

            <button
              onClick={
                loadProducts
              }
              style={
                refreshButton
              }
              disabled={
                loadingProducts
              }
            >
              {loadingProducts
                ? "Loading..."
                : "🔄 Refresh"}
            </button>

          </div>


          <input
            style={inputStyle}
            placeholder="🔎 Search products..."
            value={search}
            onChange={
              e =>
                setSearch(
                  e.target.value
                )
            }
          />


          {loadingProducts &&
            products.length === 0 && (

              <div
                style={
                  loadingBox
                }
              >
                ⏳ Loading products...
              </div>

            )}


          {!loadingProducts &&
            filteredProducts.length === 0 && (

              <div
                style={
                  emptyBox
                }
              >

                <div
                  style={{
                    fontSize:
                      "42px",
                  }}
                >
                  📦
                </div>

                <strong>
                  No products found
                </strong>

                <p style={mutedText}>
                  Add a product or change your search.
                </p>

              </div>

            )}


          <div style={productGrid}>

            {filteredProducts.map(
              (product, index) => {

                const productId =
                  getProductId(
                    product
                  );

                const productName =
                  product?.name ||
                  "Unnamed Product";

                const isDeleting =
                  deletingProduct ===
                  productId;

                return (

                  <div
                    key={
                      productId ||
                      `${productName}-${index}`
                    }
                    style={
                      productCard
                    }
                  >

                    <div
                      style={
                        productImageBox
                      }
                    >

                      {product?.image ? (

                        <img
                          src={
                            product.image
                          }
                          alt={
                            productName
                          }
                          style={
                            productImage
                          }
                        />

                      ) : (

                        <div
                          style={{
                            color:
                              "#94a3b8",
                            fontWeight:
                              "700",
                          }}
                        >
                          No Image
                        </div>

                      )}

                    </div>


                    <div
                      style={
                        productInfo
                      }
                    >

                      <div
                        style={
                          tagRow
                        }
                      >

                        <span
                          style={
                            categoryTag
                          }
                        >
                          {product?.category ||
                            "Electronics"}
                        </span>

                        <span
                          style={
                            sectionTag
                          }
                        >
                          {product?.section ||
                            "Featured"}
                        </span>

                      </div>


                      <h3
                        style={
                          productNameStyle
                        }
                      >
                        {productName}
                      </h3>


                      <div
                        style={
                          priceStyle
                        }
                      >
                        ৳{" "}
                        {Number(
                          product?.price ||
                          0
                        ).toLocaleString()}
                      </div>


                      <div
                        style={
                          productIdStyle
                        }
                      >
                        ID:{" "}
                        {productId ||
                          "N/A"}
                      </div>


                      <button
                        onClick={() =>
                          deleteProduct(
                            productId,
                            productName
                          )
                        }
                        style={
                          deleteButton
                        }
                        disabled={
                          Boolean(
                            deletingProduct
                          )
                        }
                      >
                        {isDeleting
                          ? "Deleting..."
                          : "🗑️ Delete Product"}
                      </button>

                    </div>

                  </div>

                );
              }
            )}

          </div>

        </div>


        {/* =================================================
            ORDERS
        ================================================= */}

        <div style={cardStyle}>

          <div style={sectionHeader}>

            <div>

              <h2 style={sectionTitle}>
                🛒 Customer Orders
              </h2>

              <p style={mutedText}>
                {filteredOrders.length}
                {" "}
                orders found
              </p>

            </div>


            <button
              onClick={
                loadOrders
              }
              style={
                refreshButton
              }
              disabled={
                loadingOrders
              }
            >
              {loadingOrders
                ? "Loading..."
                : "🔄 Refresh"}
            </button>

          </div>


          <input
            style={inputStyle}
            placeholder="🔎 Search customer, phone, address, order ID..."
            value={orderSearch}
            onChange={
              e =>
                setOrderSearch(
                  e.target.value
                )
            }
          />


          {loadingOrders && (

            <div
              style={
                loadingBox
              }
            >
              ⏳ Loading orders...
            </div>

          )}


          {!loadingOrders &&
            filteredOrders.length === 0 && (

              <div
                style={
                  emptyBox
                }
              >

                <div
                  style={{
                    fontSize:
                      "42px",
                  }}
                >
                  🛒
                </div>

                <strong>
                  No customer orders
                </strong>

                <p style={mutedText}>
                  New orders will appear here.
                </p>

              </div>

            )}


          <div style={orderList}>

            {filteredOrders.map(
              (order, index) => (

                <OrderCard

                  key={
                    getOrderId(
                      order
                    ) ||
                    index
                  }

                  order={
                    order
                  }

                  index={
                    index
                  }

                  updateOrderStatus={
                    updateOrderStatus
                  }

                  deleteOrder={
                    deleteOrder
                  }

                  updatingOrder={
                    updatingOrder
                  }

                  deletingOrder={
                    deletingOrder
                  }

                />

              )
            )}

          </div>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon,
  title,
  value,
}) {

  return (

    <div style={statCard}>

      <div style={statIcon}>
        {icon}
      </div>

      <div>

        <div style={statTitle}>
          {title}
        </div>

        <div style={statValue}>
          {value}
        </div>

      </div>

    </div>
  );
}


/* =========================================================
   ORDER CARD
========================================================= */

function OrderCard({
  order,
  index,
  updateOrderStatus,
  deleteOrder,
  updatingOrder,
  deletingOrder,
}) {

  const status =
    order?.status ||
    "Pending";

  const orderId =
    String(
      order?.id ||
      order?._id ||
      order?.order_id ||
      ""
    );

  const isUpdating =
    String(
      updatingOrder
    ) ===
    String(orderId);

  const isDeleting =
    String(
      deletingOrder
    ) ===
    String(orderId);


  return (

    <div style={orderCard}>

      {/* ORDER HEADER */}

      <div
        style={
          orderHeader
        }
      >

        <div>

          <div
            style={
              orderNumber
            }
          >
            🧾 Order #{index + 1}
          </div>

          <div
            style={
              orderIdStyle
            }
          >
            ID:{" "}
            {orderId ||
              "N/A"}
          </div>

        </div>


        <select
          value={status}
          onChange={
            e =>
              updateOrderStatus(
                orderId,
                e.target.value
              )
          }
          style={
            statusSelect
          }
          disabled={
            isUpdating ||
            isDeleting
          }
        >

          {statuses.map(
            item => (

              <option
                key={item}
                value={item}
              >
                {item}
              </option>

            )
          )}

        </select>

      </div>


      {isUpdating && (

        <div
          style={
            statusLoading
          }
        >
          Updating order status...
        </div>

      )}


      {/* CUSTOMER */}

      <div
        style={
          customerBox
        }
      >

        <h3
          style={
            customerTitle
          }
        >
          👤 Customer Information
        </h3>


        <div
          style={
            customerGrid
          }
        >

          <Info
            label="Name"
            value={
              order?.customer_name ||
              "N/A"
            }
          />

          <Info
            label="Phone"
            value={
              order?.phone ||
              "N/A"
            }
          />

          <Info
            label="Payment"
            value={
              order?.payment_method ||
              "COD"
            }
          />

          <Info
            label="Address"
            value={
              order?.address ||
              "N/A"
            }
          />

        </div>

      </div>


      {/* PRODUCTS */}

      <h3
        style={
          orderedTitle
        }
      >
        📦 Ordered Products
      </h3>


      {(order?.items || []).length === 0 && (

        <div
          style={
            noItemsBox
          }
        >
          No products found in this order.
        </div>

      )}


      {(order?.items || []).map(
        (item, itemIndex) => {

          const itemPrice =
            Number(
              item?.price || 0
            );

          const quantity =
            Number(
              item?.quantity || 0
            );

          const itemTotal =
            itemPrice *
            quantity;

          return (

            <div
              key={
                itemIndex
              }
              style={
                orderItem
              }
            >

              <div
                style={
                  itemImageBox
                }
              >

                {item?.image ? (

                  <img
                    src={
                      item.image
                    }
                    alt={
                      item?.name ||
                      "Product"
                    }
                    style={
                      itemImage
                    }
                  />

                ) : (

                  <span
                    style={{
                      fontSize:
                        "25px",
                    }}
                  >
                    📦
                  </span>

                )}

              </div>


              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                }}
              >

                <strong>
                  {item?.name ||
                    "Unnamed Product"}
                </strong>

                <div
                  style={
                    itemMeta
                  }
                >
                  ৳{" "}
                  {itemPrice.toLocaleString()}
                  {" × "}
                  {quantity}
                </div>

              </div>


              <strong>
                ৳{" "}
                {itemTotal.toLocaleString()}
              </strong>

            </div>

          );
        }
      )}


      {/* TOTAL */}

      <div
        style={
          totalRow
        }
      >

        <span>
          Order Total
        </span>

        <strong
          style={
            totalPrice
          }
        >
          ৳{" "}
          {Number(
            order?.total || 0
          ).toLocaleString()}
        </strong>

      </div>


      {/* DELETE */}

      <button
        onClick={() =>
          deleteOrder(
            orderId
          )
        }
        style={
          deleteButton
        }
        disabled={
          isDeleting ||
          isUpdating
        }
      >
        {isDeleting
          ? "Deleting..."
          : "🗑️ Delete Order"}
      </button>

    </div>
  );
}


/* =========================================================
   INFO
========================================================= */

function Info({
  label,
  value,
}) {

  return (

    <div>

      <div
        style={
          infoLabel
        }
      >
        {label}
      </div>

      <div
        style={{
          wordBreak:
            "break-word",
          color:
            "#0f172a",
        }}
      >
        {value}
      </div>

    </div>
  );
}


/* =========================================================
   STYLES
========================================================= */

const page = {
  minHeight: "100vh",
  background:
    "linear-gradient(135deg,#eef4ff 0%,#f8fafc 45%,#eef2ff 100%)",
  padding: "25px",
  boxSizing: "border-box",
  fontFamily:
    "Inter,Arial,Helvetica,sans-serif",
};

const container = {
  maxWidth: "1250px",
  margin: "0 auto",
};

const loginPage = {
  minHeight: "100vh",
  background:
    "linear-gradient(135deg,#dbeafe,#eef2ff,#f8fafc)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  boxSizing: "border-box",
};

const loginCard = {
  width: "420px",
  maxWidth: "100%",
  background: "#ffffff",
  padding: "38px",
  borderRadius: "24px",
  boxShadow:
    "0 25px 70px rgba(37,99,235,.16)",
  textAlign: "center",
  boxSizing: "border-box",
  border:
    "1px solid #e2e8f0",
};

const logoCircle = {
  width: "72px",
  height: "72px",
  borderRadius: "22px",
  background:
    "linear-gradient(135deg,#2563eb,#4f46e5)",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "31px",
  margin: "0 auto",
  boxShadow:
    "0 12px 30px rgba(37,99,235,.25)",
};

const loginTitle = {
  margin: "15px 0 5px",
  color: "#0f172a",
  fontSize: "28px",
  fontWeight: "900",
};

const loginSubtitle = {
  color: "#64748b",
  margin: "0 0 25px",
};

const loginErrorStyle = {
  background: "#fef2f2",
  color: "#dc2626",
  border:
    "1px solid #fecaca",
  padding: "11px",
  borderRadius: "10px",
  marginBottom: "15px",
  whiteSpace: "pre-line",
  fontSize: "13px",
  fontWeight: "700",
};

const backendInfo = {
  marginTop: "16px",
  color: "#64748b",
  fontSize: "11px",
  lineHeight: "1.6",
  wordBreak: "break-all",
};

const headerCard = {
  background:
    "linear-gradient(135deg,#0f172a,#1e293b 55%,#312e81)",
  color: "#ffffff",
  padding: "30px",
  borderRadius: "24px",
  marginBottom: "25px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "20px",
  flexWrap: "wrap",
  boxShadow:
    "0 20px 45px rgba(15,23,42,.18)",
};

const headerTitle = {
  margin: "8px 0 3px",
  fontSize: "34px",
  fontWeight: "900",
};

const headerSubtitle = {
  margin: "6px 0 0",
  color: "#cbd5e1",
};

const smallBadge = {
  display: "inline-block",
  background:
    "rgba(255,255,255,.12)",
  border:
    "1px solid rgba(255,255,255,.15)",
  padding: "7px 11px",
  borderRadius: "20px",
  fontSize: "11px",
  fontWeight: "800",
  letterSpacing: "1.5px",
};

const mutedText = {
  color: "#64748b",
  margin: "5px 0",
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(180px,1fr))",
  gap: "18px",
  marginBottom: "25px",
};

const statCard = {
  background: "#ffffff",
  padding: "20px",
  borderRadius: "18px",
  display: "flex",
  alignItems: "center",
  gap: "15px",
  boxShadow:
    "0 8px 25px rgba(15,23,42,.07)",
  border:
    "1px solid #e2e8f0",
};

const statIcon = {
  width: "52px",
  height: "52px",
  borderRadius: "15px",
  background:
    "linear-gradient(135deg,#eff6ff,#eef2ff)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "25px",
};

const statTitle = {
  color: "#64748b",
  fontSize: "13px",
  fontWeight: "600",
};

const statValue = {
  color: "#0f172a",
  fontSize: "26px",
  fontWeight: "900",
  marginTop: "3px",
};

const cardStyle = {
  background: "#ffffff",
  padding: "25px",
  borderRadius: "20px",
  marginBottom: "25px",
  boxShadow:
    "0 8px 25px rgba(15,23,42,.06)",
  border:
    "1px solid #e2e8f0",
  boxSizing: "border-box",
};

const sectionHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "15px",
  flexWrap: "wrap",
  marginBottom: "20px",
};

const sectionTitle = {
  margin: 0,
  fontSize: "22px",
  fontWeight: "900",
  color: "#0f172a",
};

const formGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(220px,1fr))",
  gap: "15px",
};

const labelStyle = {
  display: "block",
  fontWeight: "800",
  fontSize: "13px",
  marginBottom: "7px",
  color: "#334155",
};

const inputStyle = {
  width: "100%",
  padding: "13px 14px",
  marginBottom: "15px",
  border:
    "1px solid #cbd5e1",
  borderRadius: "11px",
  boxSizing: "border-box",
  fontSize: "15px",
  outline: "none",
  background: "#ffffff",
  color: "#0f172a",
};

const fileInput = {
  width: "100%",
  marginBottom: "15px",
  padding: "11px",
  border:
    "1px dashed #94a3b8",
  borderRadius: "11px",
  boxSizing: "border-box",
  background: "#f8fafc",
};

const previewBox = {
  display: "flex",
  alignItems: "center",
  gap: "15px",
  flexWrap: "wrap",
  padding: "15px",
  background: "#f8fafc",
  borderRadius: "12px",
  marginBottom: "15px",
};

const previewImage = {
  width: "130px",
  height: "130px",
  objectFit: "contain",
  background: "#ffffff",
  borderRadius: "10px",
  border:
    "1px solid #e2e8f0",
};

const removeImageButton = {
  background: "#f1f5f9",
  border:
    "1px solid #cbd5e1",
  padding: "9px 13px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "700",
};

const primaryButton = {
  width: "100%",
  background:
    "linear-gradient(135deg,#2563eb,#4f46e5)",
  color: "#ffffff",
  border: "none",
  padding: "13px 20px",
  borderRadius: "11px",
  cursor: "pointer",
  fontWeight: "800",
  fontSize: "15px",
  boxShadow:
    "0 8px 20px rgba(37,99,235,.2)",
};

const logoutButton = {
  background: "#ffffff",
  color: "#0f172a",
  border: "none",
  padding: "11px 20px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "800",
};

const refreshButton = {
  background:
    "linear-gradient(135deg,#16a34a,#15803d)",
  color: "#ffffff",
  border: "none",
  padding: "10px 16px",
  borderRadius: "9px",
  cursor: "pointer",
  fontWeight: "800",
};

const productGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fill,minmax(230px,1fr))",
  gap: "20px",
};

const productCard = {
  border:
    "1px solid #e2e8f0",
  borderRadius: "16px",
  overflow: "hidden",
  background: "#ffffff",
};

const productImageBox = {
  height: "210px",
  background:
    "linear-gradient(135deg,#f8fafc,#eef2ff)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px",
};

const productImage = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
  borderRadius: "10px",
};

const productInfo = {
  padding: "15px",
};

const tagRow = {
  display: "flex",
  gap: "6px",
  flexWrap: "wrap",
};

const categoryTag = {
  background: "#eff6ff",
  color: "#2563eb",
  padding: "5px 8px",
  borderRadius: "20px",
  fontSize: "11px",
  fontWeight: "800",
};

const sectionTag = {
  background: "#f0fdf4",
  color: "#16a34a",
  padding: "5px 8px",
  borderRadius: "20px",
  fontSize: "11px",
  fontWeight: "800",
};

const productNameStyle = {
  margin: "10px 0 5px",
  fontSize: "17px",
  color: "#0f172a",
};

const priceStyle = {
  color: "#2563eb",
  fontSize: "20px",
  fontWeight: "900",
  marginBottom: "10px",
};

const productIdStyle = {
  fontSize: "11px",
  color: "#94a3b8",
  marginBottom: "10px",
  wordBreak: "break-all",
};

const deleteButton = {
  width: "100%",
  background:
    "linear-gradient(135deg,#ef4444,#dc2626)",
  color: "#ffffff",
  border: "none",
  padding: "11px",
  borderRadius: "9px",
  cursor: "pointer",
  fontWeight: "800",
};

const emptyBox = {
  background: "#f8fafc",
  padding: "40px 20px",
  borderRadius: "14px",
  textAlign: "center",
  color: "#475569",
  marginTop: "15px",
  border:
    "1px dashed #cbd5e1",
};

const loadingBox = {
  background: "#eff6ff",
  padding: "20px",
  borderRadius: "12px",
  textAlign: "center",
  color: "#2563eb",
  fontWeight: "800",
  marginBottom: "15px",
};

const orderList = {
  display: "grid",
  gap: "20px",
};

const orderCard = {
  border:
    "1px solid #e2e8f0",
  borderRadius: "18px",
  padding: "20px",
  background: "#ffffff",
};

const orderHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "15px",
  flexWrap: "wrap",
  marginBottom: "18px",
};

const orderNumber = {
  fontSize: "19px",
  fontWeight: "900",
  color: "#0f172a",
};

const orderIdStyle = {
  color: "#94a3b8",
  fontSize: "12px",
  marginTop: "4px",
  wordBreak: "break-all",
};

const statusSelect = {
  padding: "10px 12px",
  borderRadius: "9px",
  border:
    "1px solid #cbd5e1",
  fontWeight: "700",
  background: "#ffffff",
};

const statusLoading = {
  background: "#eff6ff",
  color: "#2563eb",
  padding: "10px 12px",
  borderRadius: "9px",
  marginBottom: "15px",
  fontSize: "13px",
  fontWeight: "700",
};

const customerBox = {
  background:
    "linear-gradient(135deg,#f8fafc,#f1f5f9)",
  padding: "17px",
  borderRadius: "12px",
  marginBottom: "20px",
};

const customerTitle = {
  marginTop: 0,
  color: "#0f172a",
};

const customerGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(180px,1fr))",
  gap: "15px",
};

const infoLabel = {
  color: "#64748b",
  fontSize: "12px",
  fontWeight: "800",
  marginBottom: "3px",
};

const orderedTitle = {
  marginTop: "5px",
};

const orderItem = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "12px",
  background: "#f8fafc",
  borderRadius: "10px",
  marginBottom: "8px",
  border:
    "1px solid #eef2f7",
};

const itemImageBox = {
  width: "60px",
  height: "60px",
  flexShrink: 0,
  borderRadius: "8px",
  background: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  border:
    "1px solid #e2e8f0",
};

const itemImage = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
};

const itemMeta = {
  color: "#64748b",
  marginTop: "4px",
  fontSize: "13px",
};

const noItemsBox = {
  padding: "15px",
  background: "#f8fafc",
  borderRadius: "10px",
  color: "#64748b",
  fontSize: "13px",
};

const totalRow = {
  marginTop: "18px",
  paddingTop: "16px",
  borderTop:
    "1px solid #e2e8f0",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
};

const totalPrice = {
  fontSize: "23px",
  fontWeight: "900",
  color: "#2563eb",
};