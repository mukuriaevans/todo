//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// connect to db using mongoose
mongoose.connect('mongodb+srv://admin-evans:Test-2030@cluster0.zyra5kw.mongodb.net/todolistDB');

const itemsSchema = mongoose.Schema({
  name: {type: String, required : (true, "Please add a new item name")}
});

const listSchema = mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

const shop = new Item ({
  name: "Welcome to your To do list"
});

const visit = new Item ({
  name: "Add new Item below"
});

const report = new Item ({
  name: "<-- Check this box to clear"
});

const defaultItems = [shop, visit, report];


app.get("/", function(req, res) {

  // add defualt items to the collection
  Item.find({}, (err, results) => {
    if(err) {
      console.log(err);

      // check whether the collection is empty and if true, add defualt items
    }else if(results.length === 0){
      Item.insertMany(defaultItems, (err) => {
        if(err){
          console.log(err);
        }else{
          console.log("Documents successfully inserted to the todolistDB");
        }
        
      });

      // redirect the user to home route after adding the defualt items
      res.redirect('/');

    }else{
      res.render("list", {listTitle: "Today", newListItems: results});
      
    }

  });

});

app.get('/:customListName', (req, res) => {
  const customListName =  req.params.customListName.toLowerCase();
  List.findOne({name: customListName}, function (err, foundList){
    if(!err){
      if(!foundList){
        // Create a new list
        const list = new List ({
          name: customListName,
          items: defaultItems
        });
      
        list.save();
        res.redirect('/' + customListName);
      }else{
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  })
 
})

app.post("/", function(req, res){

  // add new item to the collection
  const itemName = req.body.newItem;
  const listName = req.body.list;

  // create new Item using ItemsSchema
  const item = new Item({
    name : itemName
  });
  
  if(listName === "Today"){

    item.save();  
    res.redirect('/');

  }else{

    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect ('/' + listName);

    });
  }
 
});

app.post('/delete', function(req, res){
  console.log(req.body.checkbox);
  const checkedItemId = req.body.checkbox
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndDelete(checkedItemId, (err) =>{
      if(!err){
        console.log("Item removed Successfully");
        res.redirect('/');
      }
    });
  }else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect('/' + listName);
      }
    });
  }
 
});



app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == ""){
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully");
});
