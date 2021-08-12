// Class for holding validation middle-ware functions for routes
export default class ValidationMiddleware {

  public validateBody;
  public validateQuery;
  public validateParams;


  constructor(joi, responseService) {
   /**
  * Request-type independent validation function
  * (used to construct middle-ware by the type-specific functions)
  */
  const validate = function(req,res,content, schemas,next)
  {
      // validate here
      let schema = joi.object();
      for (let i = 0; i < schemas.length; i++) {
        schema = schema.concat(joi.object().keys(schemas[i]));
      }
      joi.validate(content, schema, function (err, value) {
        if (!err) {
          next(); // all good, continue middle-ware-chain
        } else {
          responseService.respond(res, 400, err.details); // respond with errors (from err.details)
        }
      });
  }

  /**
   * Validation middleware function. Takes a given schema as input
   * and validates the request body with the given schema
   */
  this.validateBody = function()
  {
    const schemas = arguments;
    return function (req, res, next) {
      validate(req, res, req.body, schemas, next);
    };
  };

  /**
   * Validation middleware function. Takes a given schema as input
   * and validates the request query (after ? ex: localhost/something?q1=....) with the given schema
   */
  this.validateQuery = function(schemaObj)
  {
      const schemas = arguments;
      return function (req, res, next) {
        validate(req, res, req.query, schemas, next);
      };
    };


  /**
   * Validation middleware function. Takes a given schema as input
   * and validates the request params with the given schema
   */
  this.validateParams = function(schemaObj)
  {
    const schemas = arguments;
    return function (req, res, next) {
      validate(req, res, req.params, schemas, next);
    };
  };

  }

};
