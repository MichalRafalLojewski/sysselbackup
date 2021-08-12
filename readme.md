## Code Convention/Decrees:  
- Modules NEVER handle their own dependencies (i.e require(....)). These are handled by injection (function or   constructor injections)  
- Camel case over under-score  
- Comment at the top of each class, and above each function (javadoc-style with param and return if any... See module commenting example: https://imgur.com/a/scWvmrw)
- Non-class modules named with lower-case-first filenames, class-modules written with upper-case-first filenames  
- Follow SOLID principles (https://en.wikipedia.org/wiki/SOLID)  
- /node_modules must be present in the gitignore file at all times  
- Minimal input validation used in mongoose schema of model modules, COMPLETE validation is added to middleware of each route using joi, such that invalid requests are rejected by middleware before reaching controller function. 
- User-stories are numbered. Each commit should contain the number of the corresponding user-story.  
## Language/tech choices:  
- Programming language: Javascript + Typescript running in node
- DB ORM: Mongoose  
- Data validation: Mongoose schema at model level, joi validation at route level  
- Authentication: Passport with JWT bearer-token  
- REST Server: Express
## Stack:
**Backend:** Javascript + Typescript + Node + Express + Mongodb  
**Frontend:** React Native (mobile) and ReactJS (web)

## Project Structure:  
- Source-code is found in the src folder, end is separated into natural entities (such as user, item, profile etc...)
- server.js initializes the API and acts as composition-root for the project  (does dependency wiering and initialization)
- Each entity in src/entites contains the following classes:
  - Routes class that define the endpoints of the given entity (...Routes.ts files)
  - Controller class whos methods are mapped to by endpoints (...Controller.ts files)
  - Validation schema class that define data-validation rules for each endpoint (...JoiSchema.ts files)
  - Service class that performs the business-logic of each controller (...Service.ts files)
  - ORM class that defines the database model/schema for each entity
  - Interface that defines the data of each model (Entity_Here.ts files)
- Genral shared classes are found under src/general (note: careful, must not be too much code here... consider refactoring in the future)
  
## Running the api:  
- Install mongodb and create the /data/db folder (or equivalent in windows)
- Clone repo  
- Set environment variables (such as db connection, port etc...) in .env.dev or .env.prod file (located in root directory of project)
- Run the Scripts/prep.sh script to install globale dependencies needed (only needs to run once)
- To start the backend server lcoally, run the Scripts/run_server.sh script

## .env.dev example:
```
# SERVER:
SERVER_PORT=3000

# LOGGING
INCLUDE_LOGS=ERROR,INFO,SECURITY,IMPORTANT
ACCESSIBSLE_LOG_PATH=/home/test/LOG.log
# DB:
MONGO_CONNECT = mongodb://localhost:27017/testDb

# MANGOPAY:
MANGOPAY_CLIENT_ID = syssel
MANGOPAY_API_KEY = SECRET_KEY_HERE!!!
PAYMENT_FEE_PERCENT = 0.0
PAYOUT_FEE_PERCENT = 0.02
HOOK_CALLBACK_URL_PREFIX = http://18.222.131.73:3000/mangopay/hook/callback
HOOK_ACCESS_KEY = SECRET_KEY_HERE!!!

#AWS S3 BUCKET:
AWS_S3_BUCKET_NAME = sysselfilestore
AWS_ACCESS_KEY_ID = AKIAWPKCHJ2WA5H2P73G
AWS_SECRET_ACCESS_KEY = SECRET_KEY_HERE!!!
AWS_REGION = eu-west-1
S3_PUBLIC_URL_PREFIX = https://sysselfilestore.s3-eu-west-1.amazonaws.com

#FILE UPLOAD GENERAL
MAX_FILE_SIZE_MB = 1.5
```
