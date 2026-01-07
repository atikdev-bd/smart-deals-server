const express = require("express");
const cors = require("cors");
require("dotenv").config();
const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;

const serviceAccount = require("./smart-deals-22ac7-firebase-admin.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.use(cors());
app.use(express.json());

const fireBaseToken = async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).send({ massage: "Unauthorized Assess" });
  }

  const token = req.headers.authorization.split(" ")[1];

  if (!token) {
    return res.status(401).send({ massage: "Unauthorized Assess" });
  }

  try {
    const userInfo = await admin.auth().verifyIdToken(token);

    /// aikhane req er bodyir moddhe je token_email ase ser email ser hosse userinfo email jate kore user ke valided kora jai je jei user login ase sei user ki data chasse
    req.token_email = userInfo.email;
    next();
  } catch (error) {
    return res.status(401).send({ massage: "Unauthorized Assess" });
  }
};

const jwtVerify = (req, res, next) => {
  console.log("api hits", req.headers.authorization);
  if (!req.headers.authorization) {
    return res.status(401).send({ massage: "Unauthorized Assess" });
  }

  const token = req.headers.authorization.split(" ")[1];

  if (!token) {
    return res.status(401).send({ massage: "Unauthorized Assess" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
    if (error) {
      return res.status(401).send("Unauthorazed access");
    }

    next();
  });
};

// MongoDB connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.h7epoo8.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const database = client.db("smartShop");
    const productsCollection = database.collection("products");
    const bidsCollection = database.collection("bids");
    const usersCollection = database.collection("users");

    // jwt token post api

    app.post("/jwtToken", (req, res) => {
      const loggedUser = req.body;
      const token = jwt.sign({ loggedUser }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      res.send({ token: token });
    });

    /// users collection apis

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        res.send({ message: "User already exists" });
      } else {
        const result = await usersCollection.insertOne(user);
        res.send(result);
      }
    });

    /// products collection apis
    app.get("/products", async (req, res) => {
      const email = req.query.email;

      const query = {};
      if (email) {
        query.email = email;
      }
      const cursor = productsCollection.find(query).sort({ price_min: 1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    //product api with sort an limit

    app.get("/recent-products", async (req, res) => {
      const cursor = productsCollection
        .find()
        .sort({ created_at: -1 })
        .limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/product/:id", jwtVerify, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result);
    });

    app.post("/products", async (req, res) => {
      const newProject = req.body;
      const result = await productsCollection.insertOne(newProject);
      res.send(result);
    });

    // app.delete("/products", async (req, res) => {
    //   const query = {};
    //   const result = await productsCollection.deleteMany(query);
    //   res.send(result);
    // });

    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.deleteOne(query);
      res.send(result);
    });

    app.patch("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedProduct = req.body;

      const updateDoc = {
        $set: {
          name: updatedProduct.name,
          price: updatedProduct.price,
        },
      };

      const result = await productsCollection.updateOne(query, updateDoc);

      res.send(result);
    });

    // bids collection apis

    app.get("/bids", fireBaseToken, async (req, res) => {
      const email = req.query.email;

      const query = {};
      if (email) {
        if (email !== req.token_email) {
          return res.status(403).send({ massage: "Forbidden Access" });
        }
        query.buyer_email = email;
      }
      const cursor = bidsCollection.find(query).sort({ bid_price: -1 });
      const results = await cursor.toArray();
      res.send(results);
    });

    app.get("/bids/:productId", async (req, res) => {
      const id = req.params.productId;

      const query = { product: id };
      const cursor = bidsCollection.find(query).sort({ bid_price: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/bids", async (req, res) => {
      const newBid = req.body;
      const result = await bidsCollection.insertOne(newBid);
      res.send(result);
    });

    app.delete("/bids/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };
      const result = await bidsCollection.deleteOne(query);

      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

// F9PTAuBzohVHL408
// smartDbUser

app.get("/", (req, res) => {
  res.send("Server is running smoothly!");
});

app.listen(port, () => {
  console.log(`Example app listening on port : ${port}`);
});
