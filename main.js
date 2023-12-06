const express = require("express");
const app = express();

const { MongoClient, ObjectID } = require('mongodb');

const cors = require("cors");
app.use(cors());

const jsonparser = require("body-parser");
const bodyparser = jsonparser.json();
app.use(express.urlencoded({ extended: true }));


const fs = require("fs");
const path = require("path");
const BSON = require("bson");

const mongoose=require('mongoose')
app.set("view engine",'ejs')


app.use(express.static("views"))

const itemSchema = new mongoose.Schema(
    {
      _id:String,
      // plot: String,
      runtime: Number,
      title: String,
      year:Number,
      genres:[String],
      imdb:Object,
      poster:String,
      type:String
    },
    {
      collection: "movies",
      indexes: [
        {
          key: { _id: 1 },
          name: "id",
        },
      ],
    }
  );



  
const Item = mongoose.model("movies", itemSchema);

mongoose.connect('mongodb+srv://root:root@cluster0.xfpedj0.mongodb.net/Movies?retryWrites=true&w=majority').then((res) => {
  console.log("database connected");
})
.catch((err) => {
  console.log(err);
});

app.use(express.json());




app.get("/form",(req,res)=>{
  res.sendFile(__dirname+'/index.html')
})

// app.post('/formpost',(req,res)=>{
//   console.log(req.body)
// })



// Read Api for Accessing local database


// app.get("/jsonData", async (req, res) => {
// const bsonFilePath = path.resolve(__dirname, "movies.bson");

// function BSON2JSON(from) {
//   const buffer = fs.readFileSync(from);
//   let index = 0;
//   const documents = [];
//   while (buffer.length > index) {
//     index = BSON.deserializeStream(
//       buffer,
//       index,
//       1,
//       documents,
//       documents.length
//     );
//   }
//   return documents;
// }

// const bson2json = BSON2JSON(bsonFilePath);
// res.json(bson2json);
// });





// Search API by title


app.get("/search/:page", async (req, res) => {
  try {
    let page = parseInt(req.params.page) || 1;
    const pageSize = 10;
    const skip = (page - 1) * pageSize;
    let next = page + 1;
    let pre = page > 1 ? page - 1 : 1;

    let query = {
      $and: [
        { 'title': { $regex: new RegExp(req.query.title, 'i') } }
      ]
    };

    
    if (req.query.title) {
      query.$and.push({ 'title': { $regex: new RegExp(req.query.title, 'i') } });
    }

    const [count, movies] = await Promise.all([
      Item.countDocuments(query),
      Item.find(query).skip(skip).limit(pageSize).exec()
    ]);

    let Temp = { movies: movies, next: next, pre: pre };
    res.render("dashboard", { Temp });

  } catch (error) {
    console.error('Error during request:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});





// Read Api


  app.get("/home", bodyparser, async(req, res) => {
 
    try {
      let page = parseInt(req.params.page) || 1;
          const pageSize = 10;
          const skip = (page - 1) * pageSize;
          let next = page + 1;
          let pre = page > 1 ? page - 1 : 1;

      const query = {
          $and: [
              { poster: { $exists: true } },
              { 'imdb.rating': { $gt: 8 } }
          ]
      };

      const [count, movies] = await Promise.all([
          Item.countDocuments(query),
          Item.find(query).skip(skip).limit(pageSize).exec()
      ]);

      let Temp = { movies: movies, next: next, pre: pre };
      res.render("dashboard", { Temp });

  } catch (error) {
      console.error('Error during request:', error);
      res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});



// Api for pagination

    app.get("/home/:page", bodyparser, async (req, res) => {
      try {
          let page = parseInt(req.params.page) || 1;
          const pageSize = 10;
          const skip = (page - 1) * pageSize;
          let next = page + 1;
          let pre = page > 1 ? page - 1 : 1;
  
          const query = {
              $and: [
                  { poster: { $exists: true } },
                  { 'imdb.rating': { $gt: 8 } }
              ]
          };
  
          const [count, movies] = await Promise.all([
              Item.countDocuments(query),
              Item.find(query).skip(skip).limit(pageSize).exec()
          ]);
  
          let Temp = { movies: movies, next: next, pre: pre };
          res.render("dashboard", { Temp });

      } catch (error) {
          console.error('Error during request:', error);
          res.status(500).json({ error: 'Internal Server Error', message: error.message });
      }
  });




    // Delete Api


    app.post("/delete/:id", async (req, res) => {
      let taskId = req.params.id;
      await Item.deleteOne({ _id: taskId });
      res.redirect("/home");
    });




    // Post Api

  app.post("/postdata", bodyparser, (req, res) => {
let data = req.body
    const newData = new Item({
      _id : new mongoose.Types.ObjectId(),
      title: data.title,
      genres: data.genres,
      type:data.type,
      runtime:data.runtime,
      year:data.year,
      imdb:data.imdb
  })
  newData.save()
    .then(()=>{
        // res.send('data added successfully')
        console.log(data)
        res.redirect("/home");

        
    }).catch((err)=>{
        res.send(err)
    })
  });




  // Put Api

  
  app.put("/updateData/:id", bodyparser, (req, res) => {
    const itemId = req.params.id;
    const updatedData = req.body;
  
    // Update the item in the database
    Item.findByIdAndUpdate(itemId, updatedData, { new: true })
      .then((updatedItem) => {
        if (!updatedItem) {
          return res.status(404).send('Item not found');
        }
  
        // res.send('Data updated successfully');
        // console.log(updatedItem);
        // res.redirect("/home");
        res.render('updateData', { updatedItem, itemId });
      })
      .catch((err) => {
        res.status(500).send(err);
      });
  });



  






  // get api's for categories


  app.get('/movies/genres/Short', async (req, res) => {
    
      const genre = "Short";
      Item.aggregate([
        {
          $match: {
            genres: {
              $elemMatch: {
                $eq: genre
              }
            }
          }
        }]).skip(0).limit(10).exec()
      .then((arr) => {
           let Temp={movies:arr}
        res.render('dashboard', {Temp});
     
      })
      .catch((err) => {
        console.log(err);
      });
  });

  app.get('/movies/genres/Action', async (req, res) => {
        const genre = "Action";

        Item.aggregate([
      {
        $match: {
          genres: {
            $elemMatch: {
              $eq: genre
            }
          }
        }
      }]).skip(0).limit(10).exec()
    .then((arr) => {
         let Temp={movies:arr}
      res.render('dashboard', {Temp});
   
    })
    .catch((err) => {
      console.log(err);
    });


  });

  app.get('/movies/genres/Animation', async (req, res) => {
    
      const genre = "Animation";
      Item.aggregate([
        {
          $match: {
            genres: {
              $elemMatch: {
                $eq: genre
              }
            }
          }
        }]).skip(0).limit(10).exec()
      .then((arr) => {
           let Temp={movies:arr}
        res.render('dashboard', {Temp});
     
      })
      .catch((err) => {
        console.log(err);
      });
  });

  app.get('/movies/genres/Comedy', async (req, res) => {
    
    const genre = "Comedy";
    Item.aggregate([
      {
        $match: {
          genres: {
            $elemMatch: {
              $eq: genre
            }
          }
        }
      }]).skip(0).limit(10).exec()
    .then((arr) => {
         let Temp={movies:arr}
      res.render('dashboard', {Temp});
   
    })
    .catch((err) => {
      console.log(err);
    });
  });

  app.get('/movies/genres/Horror', async (req, res) => {
    
    const genre = "Horror";
    Item.aggregate([
      {
        $match: {
          genres: {
            $elemMatch: {
              $eq: genre
            }
          }
        }
      }]).skip(0).limit(10).exec()
    .then((arr) => {
         let Temp={movies:arr}
      res.render('dashboard', {Temp});
   
    })
    .catch((err) => {
      console.log(err);
    });
  });

  app.get('/movies/genres/Drama', async (req, res) => {
    
    const genre = "Drama";
    Item.aggregate([
      {
        $match: {
          genres: {
            $elemMatch: {
              $eq: genre
            }
          }
        }
      }]).skip(0).limit(10).exec()
    .then((arr) => {
         let Temp={movies:arr}
      res.render('dashboard', {Temp});
   
    })
    .catch((err) => {
      console.log(err);
    });
  });

  app.get('/movies/genres/Adventure', async (req, res) => {
    
    const genre = "Adventure";
    Item.aggregate([
      {
        $match: {
          genres: {
            $elemMatch: {
              $eq: genre
            }
          }
        }
      }]).skip(0).limit(10).exec()
    .then((arr) => {
         let Temp={movies:arr}
      res.render('dashboard', {Temp});
   
    })
    .catch((err) => {
      console.log(err);
    });
  });

  app.get('/movies/genres/Biography', async (req, res) => {
    
    const genre = "Biography";
    Item.aggregate([
      {
        $match: {
          genres: {
            $elemMatch: {
              $eq: genre
            }
          }
        }
      }]).skip(0).limit(10).exec()
    .then((arr) => {
         let Temp={movies:arr}
      res.render('dashboard', {Temp});
   
    })
    .catch((err) => {
      console.log(err);
    });
  });

  app.get('/movies/genres/Fantasy', async (req, res) => {
    const genre = "Fantasy";
    Item.aggregate([
      {
        $match: {
          genres: {
            $elemMatch: {
              $eq: genre
            }
          }
        }
      }]).skip(0).limit(10).exec()
    .then((arr) => {
         let Temp={movies:arr}
      res.render('dashboard', {Temp});

   
    })
    .catch((err) => {
      console.log(err);
    });
  });

  app.get('/movies/genres/Crime', async (req, res) => {
    const genre = "Crime";
    Item.aggregate([
      {
        $match: {
          genres: {
            $elemMatch: {
              $eq: genre
            }
          }
        }
      }]).skip(0).limit(10).exec()
    .then((arr) => {
         let Temp={movies:arr}
      res.render('dashboard', {Temp});
   
    })
    .catch((err) => {
      console.log(err);
    });
  });
  






// app.use((req,res)=>{                              
//     res.send('404, Page not Found')
// })

app.listen(4001, () => {
console.log("Server is Listening at port http://localhost:4001/home");
});