// Import necessary modules
import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import dotenv from "dotenv";

// Initialize Express app
const port = 3000;
const app = express();
dotenv.config();
const apiKey = process.env.API_KEY;
let fetchedRecipes = [];

//middlewares
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

//routes

// Route to handle homepage request
app.get("/", async (req, res) => {
  try {
    const result = await axios.get(
      `https://api.spoonacular.com/recipes/random?apiKey=${apiKey}&number=3`
    );
    fetchedRecipes = [];

    const recipeData = result.data.recipes;
    recipeData.forEach((r) => {
      fetchedRecipes.push(r);
    });

    res.render("index.ejs", { recipeData: recipeData });
  } catch (error) {
    res.status(404).send(error.message);
  }
});

// Route to handle recipe details request
app.get("/recipe/:id", (req, res) => {
  const id = req.params.id;
  const recipeIndex = fetchedRecipes.findIndex((recipe) => recipe.id == id);
  if (recipeIndex !== -1) {
    const recipeData = fetchedRecipes[recipeIndex];
    const instructions = [];
    recipeData.analyzedInstructions.forEach((instruction) => {
      instruction.steps.forEach((step) => {
        instructions.push(step.step);
      });
    });

    res.render("details.ejs", {
      title: recipeData.title,
      image: recipeData.image,
      ingredients: recipeData.extendedIngredients,
      instructions: instructions,
    });
  } else {
    res.status(404).send("recipe not Found");
  }
});
app.get("/searched/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const response = await axios.get(
      `https://api.spoonacular.com/recipes/${id}/information?apiKey=${apiKey}`
    );

    const recipe = response.data;
    const instructions =
      recipe.analyzedInstructions.length > 0
        ? recipe.analyzedInstructions[0].steps.map((step) => step.step)
        : [];

    res.render("searchedDetails.ejs", {
      title: recipe.title,
      image: recipe.image,
      instructions: instructions,
      ingredients: recipe.extendedIngredients,
    });
  } catch (error) {
    res.status(404).send("Recipe not found");
  }
});

// Route to handle search form submission
app.post("/search", async (req, res) => {
  const query = req.body.searchQuery;
  try {
    const searchResult = await axios.get(
      `https://api.spoonacular.com/recipes/search?apiKey=${apiKey}&query=${query}&number=3`
    );

    const searchResults = searchResult.data.results;
    const fetchedRecipes = [];

    // Fetch detailed information for each recipe
    for (const result of searchResults) {
      const detailedResult = await axios.get(
        `https://api.spoonacular.com/recipes/${result.id}/information?apiKey=${apiKey}`
      );
      fetchedRecipes.push(detailedResult.data);
    }

    res.render("searched.ejs", { recipeData: fetchedRecipes });
  } catch (error) {
    res.status(404).send(error.message);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`listening for requests on port ${port}`);
});
