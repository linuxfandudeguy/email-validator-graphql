const express = require('express');
const { createHandler } = require('graphql-http/lib/use/express');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { loadSchemaSync } = require('@graphql-tools/load');
const { GraphQLFileLoader } = require('@graphql-tools/graphql-file-loader');
const validator = require('validator');
const path = require('path');

// Load the schema from the `schema.graphql` file
const typeDefs = loadSchemaSync(path.join(__dirname, 'schema.graphql'), {
  loaders: [new GraphQLFileLoader()],
});

// Resolvers for the GraphQL API
const resolvers = {
  Query: {
    validateEmail: (_, { email }) => {
      return validator.isEmail(email)
        ? `The email '${email}' is valid.`
        : `The email '${email}' is invalid.`;
    },
  },
};

// Create the executable schema
const schema = makeExecutableSchema({ typeDefs, resolvers });

const app = express();

// Serve all static files in the `views` folder
app.use(express.static(path.join(__dirname, 'views')));

// Set up caching headers
function addCacheHeaders(req, res, next) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  next();
}

// Apply headers middleware globally
app.use(addCacheHeaders);

// Set up the GraphQL endpoint
function setupGraphQLEndpoint() {
  app.use(
    '/graphql',
    createHandler({
      schema,
      graphiql: false, // GraphQL API endpoint with no GraphiQL interface enabled
    })
  );
}

// Set up the GraphiQL interface
function setupGraphiQL() {
  app.get('/graphiql', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>GraphiQL</title>
          <script src="../react.development.js"></script>
          <script src="../react-dom.development.js"></script>
          <script src="../graphiql.min.js"></script>
          <link rel="stylesheet" href="../graphiql.min.css" />
        </head>
        <body style="margin: 0;">
          <div id="graphiql" style="height: 100vh;"></div>
          <script>
            const graphQLFetcher = (graphQLParams) => {
              return fetch('/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(graphQLParams),
              })
              .then((response) => response.json())
              .catch((error) => error);
            };

            ReactDOM.render(
              React.createElement(GraphiQL, { fetcher: graphQLFetcher }),
              document.getElementById('graphiql')
            );
          </script>
        </body>
      </html>
    `);
  });
}

// Call the functions to set up the API and GraphiQL
setupGraphQLEndpoint();
setupGraphiQL();

const PORT = 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`Access the GraphQL API at http://localhost:${PORT}/graphql`);
  console.log(`Access the GraphiQL interface at http://localhost:${PORT}/graphiql`);
});
