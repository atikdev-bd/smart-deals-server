const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// MongoDB connection
const uri =
  "mongodb+srv://smartDbUser:F9PTAuBzohVHL408@cluster0.h7epoo8.mongodb.net/?appName=Cluster0";

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

    app.get("/products", async (req, res) => {
      const email = req.query.email;
      console.log(email);
      const query = {};
      if (email) {
        query.email = email;
      }
      const cursor = productsCollection.find(query).sort({ price_min: 1 });
      const products = await cursor.toArray();
      res.send(products);
    });

    app.get("/products/:id", async (req, res) => {
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
      console.log(updatedProduct);

      const result = await productsCollection.updateOne(query, updateDoc);

      res.send(result);
    });

    // bids collection apis

    app.get("/bids", async (req, res) => {
      const email = req.query.email;
      console.log(email);
      const query = {};
      if (email) {
        query.buyer_email = email;
      }
      const cursor = bidsCollection.find(query);
      const results = await cursor.toArray();
      res.send(results);
    });

    app.post("/bids", async (req, res) => {
      const newBid = req.body;
      const result = await bidsCollection.insertOne(newBid);
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
