/** 
 * @module 
 * @fileoverview This file sets up a GraphQL API server using Express and provides
 * an endpoint for interacting with GraphQL. The API exposes a query to validate email addresses.
 * 
 * Usage:
 * - To make a GET request, query the `/graphql` endpoint with a URL-encoded query string.
 * - To make a POST request, send a JSON object containing the query to the `/graphql` endpoint.
 */

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
/**
 * @function
 * @description Validates the given email address.
 * 
 * @param {Object} _ - Parent object (unused).
 * @param {Object} args - Arguments passed to the query.
 * @param {string} args.email - The email address to validate.
 * @returns {string} A message indicating whether the email is valid or invalid.
 * 
 * <pre>
 * // Usage:
 * validateEmail({ email: "someoneelse@gmail.com" })
 * // Returns: "The email 'someoneelse@gmail.com' is valid."
 * </pre>
 */
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

/**
 * @function
 * @description This function sets up the `/graphql` endpoint to handle both GET and POST requests for email validation.
 * 
 * <p><strong>GET request:</strong> Queries are sent as URL parameters.</p>
 * <pre>
 * /graphql?query=query%20%7B%0A%20%20validateEmail(email%3A%20%22someoneelse%40gmail.com%22)%0A%7D%0A
 * </pre>
 * <p>This sends a query to validate the email <code>someoneelse@gmail.com</code>.</p>
 * 
 * <p><strong>POST request:</strong> Queries are sent in the body as JSON.</p>
 * <pre>
 * curl -X POST http://localhost:4000/graphql \
 *   -H "Content-Type: application/json" \
 *   -d '{"query": "query { validateEmail(email: \"someoneelse@gmail.com\") }"}'
 * </pre>
 * <p>The response will contain whether the email is valid or not.</p>
 *  
 *  <iframe src="/graphiql" width="100%" height="600px"></iframe>
 *
 * <p>For more on how GraphQL works, see <a href="https://graphql.org/">GraphQL Official Documentation</a>.</p>
 */
function setupGraphQLEndpoint() {
  app.use(
    '/graphql',
    createHandler({
      schema,
      graphiql: false, // GraphQL API endpoint with no GraphiQL interface enabled
    })
  );
}

/**
 * @function
 * @description This function serves the GraphiQL interface at the `/graphiql` endpoint.
 * 
 * <p>This endpoint provides a user-friendly interface to interact with the GraphQL API.</p>
 */
function setupGraphiQL() {
  app.get('/graphiql', (req, res) => {
    // Serve a custom HTML page for GraphiQL interface
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
