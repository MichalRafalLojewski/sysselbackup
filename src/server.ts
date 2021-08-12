// other:
enum DevMode {
  DEV = 'development',
  PROD = 'production',
  STAGING = 'staging',
}

import './lib/env';
import express = require('express');
import bodyParser = require('body-parser');
import passport = require('passport');
import passportJWT = require('passport-jwt');
import ExtractJwt = passportJWT.ExtractJwt;
import JwtStrategy = passportJWT.Strategy;
import jwt = require('jsonwebtoken');
import mongoose = require('mongoose');
import joi = require('joi');
import bcrypt = require('bcrypt');
import asyncModule = require('async');
import expressStatsMonitorRoute = require('express-status-monitor');
import multer = require('multer');
import AWS = require('aws-sdk');
import firebaseAdmin = require('firebase-admin');
import fs = require('fs');
import nodemailer = require('nodemailer');
import cors = require('cors');
const Stripe = require('stripe');

// -------------- MODULES: --------------
// loggers:
import ConsoleLogger from './general/loggers/ConsoleLogger';
// controllers:
import UserController from './entities/user/UserController';
import CampaignController from './entities/campaign/CampaignController';
import ItemController from './entities/item/ItemController';
import MessageController from './entities/message/MessageController';
import OrderController from './entities/order/OrderController';
import TransactionController from './entities/transaction/TransactionController';
import ProfileController from './entities/profile/ProfileController';
import ItemReviewController from './entities/itemReview/ItemReviewController';
import ItemOptionsController from './entities/itemOptions/ItemOptionsController';
import ProfileSubscriptionController from './entities/profileSubscription/ProfileSubscriptionController';
import EventController from './entities/event/EventController';
import CategoryController from './entities/category/CategoryController';
import BidController from './entities/bid/BidController';
import ProfileReviewController from './entities/profileReview/ProfileReviewController';
import MissionController from './entities/mission/MissionController';
import FileController from './entities/file/FileController';
import RootController from './general/controllers/RootController';
import LogController from './general/controllers/LogController';
import PickupLocationController from './entities/pickupLocation/PickupLocationController';
import DeliveryEventController from './entities/deliveryEvent/DeliveryEventController';
import ProblemReportController from './entities/problemReport/ProblemReportController';
// mongoose models:
import UserModel from './entities/user/User';
import CampaignModel from './entities/campaign/Campaign';
import ItemModel from './entities/item/Item';
import MessageModel from './entities/message/Message';
import OrderModel from './entities/order/Order';
import ProfileModel from './entities/profile/Profile';
import TransactionModel from './entities/transaction/Transaction';
import ItemReviewModel from './entities/itemReview/ItemReview';
import ItemOptionsModel from './entities/itemOptions/ItemOptions';
import ProfileSubscriptionModel from './entities/profileSubscription/ProfileSubscription';
import EventModel from './entities/event/Event';
import CategoryModel from './entities/category/Category';
import MissionModel from './entities/mission/Mission';
import BidModel from './entities/bid/Bid';
import ProfileReviewModel from './entities/profileReview/ProfileReview';
import FileModel from './entities/file/File';
import PickupLocationModel from './entities/pickupLocation/PickupLocation';
import DeliveryEventModel from './entities/deliveryEvent/DeliveryEvent';
import ProblemReportModel from './entities/problemReport/ProblemReport';
// joi schemas:
import GeneralJoiSchema from './general/JoiSchemas/GeneralJoiSchema';
import CampaignJoiSchema from './entities/campaign/CampaignJoiSchema';
import ItemJoiSchema from './entities/item/ItemJoiSchema';
import ItemReviewJoiSchema from './entities/itemReview/ItemReviewJoiSchema';
import ItemOptionsJoiSchema from './entities/itemOptions/ItemOptionsJoiSchema';
import MessageJoiSchema from './entities/message/MessageJoiSchema';
import OrderJoiSchema from './entities/order/OrderJoiSchema';
import ProfileJoiSchema from './entities/profile/ProfileJoiSchema';
import UserJoiSchema from './entities/user/UserJoiSchema';
import EventJoiSchema from './entities/event/EventJoiSchema';
import MissionJoiSchema from './entities/mission/MissionJoiSchema';
import BidJoiSchema from './entities/bid/BidJoiSchema';
import ProfileReviewJoiSchema from './entities/profileReview/ProfileReviewJoiSchema';
import FileJoiSchema from './entities/file/FileJoiSchema';
import PickupLocationJoiSchema from './entities/pickupLocation/PickupLocationJoiSchema';
import DeliveryEventJoiSchema from './entities/deliveryEvent/DeliveryEventJoiSchema';
import ProblemReportJoiSchema from './entities/problemReport/ProblemReportJoiSchema';
// checkers:
import BidChecker from './entities/bid/BidChecker';
import OrderChecker from './entities/order/OrderChecker';
import ProfileSubscriptionChecker from './entities/profileSubscription/ProfileSubscriptionChecker';
import TransactionChecker from './entities/transaction/TransactionChecker';
import ItemReviewChecker from './entities/itemReview/ItemReviewChecker';
import ProfileReviewChecker from './entities/profileReview/ProfileReviewChecker';
import MessageChecker from './entities/message/MessageChecker';
import MissionChecker from './entities/mission/MissionChecker';
import EventChecker from './entities/event/EventChecker';
// constants:
import Responses from './general/consts/Responses';
import TransactionSettings from './general/consts/TransactionSettings';
import SecurityConsts from './general/consts/SecurityConsts';
// repositories:
import StripeRepository from './entities/order/paymentProcessing/stripe/StripeRepository';

// services:
import ProblemReportService from './entities/problemReport/ProblemReportService';
import RandomService from './general/services/RandomService';
import ResponseService from './general/services/ResponseService';
import QueryService from './general/services/QueryService';
import TokenDispenser from './general/services/TokenDispenser';
import HashingService from './general/services/HashingService';
import GeneralModelService from './general/services/GeneralModelService';
import OrderHelper from './entities/order/OrderHelper';
import OrderService from './entities/order/OrderService';
import UserService from './entities/user/UserService';
import TransactionService from './entities/transaction/TransactionService';
import ItemReviewService from './entities/itemReview/ItemReviewService';
import CampaignService from './entities/campaign/CampaignService';
import ItemOptionsService from './entities/itemOptions/ItemOptionsService';
import ItemService from './entities/item/ItemService';
import MessageService from './entities/message/MessageService';
import ProfileSubscriptionService from './entities/profileSubscription/ProfileSubscriptionService';
import ProfileService from './entities/profile/ProfileService';
import EventService from './entities/event/EventService';
import CategoryService from './entities/category/CategoryService';
import MissionService from './entities/mission/MissionService';
import BidService from './entities/bid/BidService';
import ProfileReviewService from './entities/profileReview/ProfileReviewService';
import ItemChecker from './entities/item/ItemChecker';
import S3FileService from './entities/file/vendor_services/S3FileService';
import FileService from './entities/file/FileService';
import BelongsToService from './general/services/BelongsToService';
import FirebaseMessagingService from './general/services/FirebaseMessagingService';
import FileReaderService from './general/services/FileReaderService';
import { MailService, MailConfigIF } from './general/services/MailService';
import PickupLocationService from './entities/pickupLocation/PickupLocationService';
import DeliveryEventService from './entities/deliveryEvent/DeliveryEventService';
import GeneralEntityService from './general/services/GeneralEntityService';
import StripeService from './entities/order/paymentProcessing/stripe/StripeService';
// middleware:
import ValidationMiddleware from './general/middleware/ValidationMiddleware';
import AuthMiddleware from './general/middleware/AuthMiddleware';
import StripeMiddleware from './general/middleware/StripeMiddleware';
import compressionMiddleware = require('compression');
// routes:
import PickupLocationRoutes from './entities/pickupLocation/PickupLocationRoutes';
import DeliveryEventRoutes from './entities/deliveryEvent/DeliveryEventRoutes';
import CampaignRoutes from './entities/campaign/CampaignRoutes';
import ItemRoutes from './entities/item/ItemRoutes';
import ItemOptionsRoutes from './entities/itemOptions/ItemOptionsRoutes';
import ItemReviewRoutes from './entities/itemReview/ItemReviewRoutes';
import MessageRoutes from './entities/message/MessageRoutes';
import OrderRoutes from './entities/order/OrderRoutes';
import ProfileRoutes from './entities/profile/ProfileRoutes';
import UserRoutes from './entities/user/UserRoutes';
import ProfileSubscriptionRoutes from './entities/profileSubscription/ProfileSubscriptionRoutes';
import TransactionRoutes from './entities/transaction/TransactionRoutes';
import EventRoutes from './entities/event/EventRoutes';
import CategoryRoutes from './entities/category/CategoryRoutes';
import MissionRoutes from './entities/mission/MissionRoutes';
import BidRoutes from './entities/bid/BidRoutes';
import FileRoutes from './entities/file/FileRoutes';
import ProfileReviewRoutes from './entities/profileReview/ProfileReviewRoutes';
import { UserIF } from './entities/user/UserIF';
import UserAuthCertificate from './entities/user/UserAuthCertificate';
import LoggerIF from './general/loggers/LoggerIF';
import RootRoutes from './general/routers/RootRoutes';
import LogRoutes from './general/routers/LogRoutes';
import UserEventController from './entities/userEvent/UserEventController';
import UserEventService from './entities/userEvent/UserEventService';
import UserEventModel from './entities/userEvent/UserEvent';
import UserEventChecker from './entities/userEvent/UserEventChecker';
import UserEventRoutes from './entities/userEvent/UserEventRoutes';
import { DefaultItemOptions, DefaultPaymentOption } from './entities/order/OrderDefaults';
import MigrationIF from './migrations/MigrationIF';
import CategoryJoiSchema from './entities/category/CategoryJoiSchema';
import ProblemReportRoutes from './entities/problemReport/ProblemReportRoutes';

//import MakeUsersAdminMigration from "./migrations/MakeUsersAdminMigration";
// -------------- /MODULES --------------
const INCLUDE_LOGS = process.env.INCLUDE_LOGS.split(',')
  .map((log_type) => log_type.trim())
  .filter((log_type) => log_type.length > 0);
const logger: LoggerIF = new ConsoleLogger(INCLUDE_LOGS); // instantiate here so it can be used during init below

/*
 * Module for initializing an express service endpoint.
 * Initializes dependencies, defines routes, and acts as composition root for project.
 */
// -------------- AUTH SETUP: --------------
// passport strategy:
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: 'secret',
};
const strategy = new JwtStrategy(jwtOptions, function (authCertificate: UserAuthCertificate, next) {
  const success = (user: UserIF) => {
    next(null, user);
  };
  const authFail = (err) => {
    next(null, false);
  };
  userModel
    .findOne({ _id: authCertificate.id })
    .then((user: UserIF) => {
      if (authCertificate.token_version != user.token_version) {
        return authFail('Invalid token version');
      }
      success(user);
    })
    .catch(authFail);
});
passport.use(strategy);
// -------------- /AUTH SETUP: --------------

// -------------- DB SETUP: --------------
mongoose.connect(process.env.MONGO_CONNECT, { useNewUrlParser: true, useUnifiedTopology: true }).catch(function (err) {
  logger.error('server.js', 'Error connecting to DB: ' + err);
});
const db = mongoose.connection; // make sure to run in command in mongo-shell: db.collection.ensureIndex({ location: '2dsphere' });
// -------------- /DB SETUP: --------------

// ----------- AMAZON S3 SETUP ----------
const aws_s3_bucket_sdk = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3_bucket_name = process.env.AWS_S3_BUCKET_NAME,
  s3_public_url_prefix = process.env.S3_PUBLIC_URL_PREFIX,
  file_size_limit_bytes = Math.floor(parseFloat(process.env.MAX_FILE_SIZE_MB) * 1000000);
// ----------- /AMAZON S3 SETUP ----------

// ---------- MULTER ------------
const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  errorHandling: 'manual',
  limits: {
    fileSize: file_size_limit_bytes,
  },
  fileFilter: (req, file, cb) => {
    req.wrongFileType = file.mimetype != 'image/jpeg';
    cb(null, true);
  },
});
// -------- /MULTER ----------------

// ---------- EMAIL ------------
const MAIL_CONFIG: MailConfigIF = {
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT),
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
};
// ---------- /EMAIL ------------

// ---------- PAYMENT ------------

const stripeGateway = new Stripe(process.env.STRIPE_SECRET_KEY);

const rawBodyBuffer = (req, res, buffer, encoding) => {
  if (!req.headers['stripe-signature']) {
    return;
  }
  if (buffer && buffer.length) {
    req.rawBody = buffer;
  }
};

// ---------- /PAYMENT ------------

// -------- FIREBASE --------------- (FOR CLOUD MESSAGING)
const firebaseServiceAccount = require('../firebase-key.json');
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(firebaseServiceAccount),
  databaseURL: 'https://syssel-app-4e1eb.firebaseio.com',
});
// ------- /FIREBASE --------------

// -------------- EXPRESS SETUP: --------------
const LOG_PATH_MIDDLEWARE = (log_path: string) => {
  // middleware for processing log-paths before they hit the log
  if (log_path.startsWith('/mangopay/hook/callback')) {
    return '/mangopay/hook/callback/!ACCESS_KEY_HIDDEN!';
  }
  return log_path;
};

const app = express();
app.use(cors());
app.use(compressionMiddleware()); // enable compression for all routes
app.use(expressStatsMonitorRoute());
app.use(passport.initialize());
app.use(bodyParser.json({ verify: rawBodyBuffer, limit: '50mb', extended: true } as any));
app.use(bodyParser.urlencoded({ verify: rawBodyBuffer, limit: '50mb', extended: true }));
app.use(bodyParser.json({}));

app.use((req, res, next) => {
  logger.info('Express', 'Request to: ' + LOG_PATH_MIDDLEWARE(req.originalUrl) + '  Method: ' + req.method + ', Request size: ' + req.socket.bytesRead + ' bytes');
  next();
});
// -------------- /EXPRESS SETUP: --------------

// -------------- INITIATION AND DEPENDENCY INJECTION: --------------

// -------------- INSTANCES: --------------
// consts:
const transactionSettings = new TransactionSettings(parseFloat(process.env.PAYMENT_FEE_PERCENT) || 0),
  securityConsts = new SecurityConsts(),
  responses = new Responses(),
  // mongoose models:
  userModel = new UserModel(mongoose).model,
  itemModel = new ItemModel(mongoose).model,
  campaignModel = new CampaignModel(mongoose).model,
  messageModel = new MessageModel(mongoose).model,
  orderModel = new OrderModel(mongoose).model,
  profileModel = new ProfileModel(mongoose).model,
  transactionModel = new TransactionModel(mongoose).model,
  itemReviewModel = new ItemReviewModel(mongoose).model,
  itemOptionsModel = new ItemOptionsModel(mongoose).model,
  profileSubscriptionModel = new ProfileSubscriptionModel(mongoose).model,
  eventModel = new EventModel(mongoose).model,
  categoryModel = new CategoryModel(mongoose).model,
  missionModel = new MissionModel(mongoose).model,
  bidModel = new BidModel(mongoose).model,
  profileReviewModel = new ProfileReviewModel(mongoose).model,
  fileModel = new FileModel(mongoose).model,
  userEventModel = new UserEventModel(mongoose).model,
  pickupLocationModel = new PickupLocationModel(mongoose).model,
  deliveryEventModel = new DeliveryEventModel(mongoose).model,
  problemReportModel = new ProblemReportModel(mongoose).model,
  // repositories:
  stripeRepository = new StripeRepository(stripeGateway, logger, process.env.ADMIN_HOST),
  // services:
  stripeService = new StripeService(stripeRepository, logger),
  mailService = new MailService(MAIL_CONFIG, nodemailer, logger),
  randomService = new RandomService(),
  eventChecker = new EventChecker(),
  firebaseMessagingService = new FirebaseMessagingService(firebaseAdmin, logger),
  missionChecker = new MissionChecker(),
  messageChecker = new MessageChecker(),
  fileUploadService = new S3FileService(s3_bucket_name, aws_s3_bucket_sdk),
  generalModelService = new GeneralModelService(),
  queryService = new QueryService(),
  fileService = new FileService(fileModel, fileUploadService, generalModelService, queryService, responses, s3_public_url_prefix, file_size_limit_bytes, logger),
  orderChecker = new OrderChecker(DefaultItemOptions),
  userEventChecker = new UserEventChecker(),
  responseService = new ResponseService(logger),
  tokenDispenser = new TokenDispenser(jwt, jwtOptions),
  hashingService = new HashingService(bcrypt, securityConsts),
  generalEntityService = new GeneralEntityService(fileService, generalModelService, logger),
  profileService = new ProfileService(profileModel, itemModel, campaignModel, queryService, generalModelService, fileService, randomService, logger, generalEntityService),
  userService = new UserService(userModel, profileService, stripeService, tokenDispenser, hashingService, queryService, responses, randomService, mailService, logger),
  profileSubscriptionChecker = new ProfileSubscriptionChecker(profileSubscriptionModel),
  profileSubscriptionService = new ProfileSubscriptionService(profileSubscriptionModel, profileService, queryService, profileSubscriptionChecker, responses, logger),
  bidChecker = new BidChecker(profileService),
  transactionChecker = new TransactionChecker(),
  orderHelper = new OrderHelper(transactionSettings),
  transactionService = new TransactionService(transactionModel, queryService, transactionChecker, logger),
  itemChecker = new ItemChecker(generalModelService),
  itemOptionsService = new ItemOptionsService(queryService, itemOptionsModel, generalModelService, responses, logger),
  itemService = new ItemService(itemModel, profileSubscriptionService, generalEntityService, queryService, itemChecker, responses, fileService, generalModelService, itemOptionsService, logger),
  belongsToService = new BelongsToService(orderChecker, missionChecker, transactionChecker, profileModel, missionModel, orderModel, transactionModel),
  eventService = new EventService(queryService, eventModel, userModel, belongsToService, profileService, firebaseMessagingService, logger),
  userEventService = new UserEventService(queryService, userEventModel, belongsToService, userService, firebaseMessagingService, logger),
  pickupLocationService = new PickupLocationService(pickupLocationModel, queryService, logger),
  deliveryEventService = new DeliveryEventService(deliveryEventModel, pickupLocationService, queryService, responses, logger),
  orderService = new OrderService(
    orderModel,
    itemService,
    orderChecker,
    queryService,
    orderHelper,
    eventService,
    asyncModule,
    DefaultItemOptions,
    DefaultPaymentOption,
    pickupLocationService,
    deliveryEventService,
    profileService,
    stripeService,
    userService,
    logger
  ),
  campaignService = new CampaignService(campaignModel, profileSubscriptionService, queryService, responses, generalModelService, fileService, logger),
  itemReviewChecker = new ItemReviewChecker(),
  missionService = new MissionService(missionModel, queryService, profileSubscriptionService, fileService, generalModelService, responses, logger),
  itemReviewService = new ItemReviewService(queryService, eventService, itemReviewModel, itemReviewChecker, profileService, generalModelService, belongsToService, logger),
  messageService = new MessageService(queryService, messageModel, eventService, orderChecker, messageChecker, belongsToService, logger),
  categoryService = new CategoryService(queryService, categoryModel, logger),
  bidService = new BidService(bidModel, queryService, missionService, eventService, profileService, itemService, bidChecker, generalModelService, logger),
  profileReviewChecker = new ProfileReviewChecker(),
  profileReviewService = new ProfileReviewService(queryService, eventService, profileReviewChecker, profileReviewModel, orderService, generalModelService, belongsToService, logger),
  fileReaderService = new FileReaderService(fs, logger),
  problemReportService = new ProblemReportService(queryService, problemReportModel, responses, logger),
  // joi schemas:
  generalSchema = new GeneralJoiSchema(joi),
  campaignSchema = new CampaignJoiSchema(joi, generalSchema),
  itemSchema = new ItemJoiSchema(joi, generalSchema),
  itemReviewSchema = new ItemReviewJoiSchema(joi, generalSchema),
  itemOptionsSchema = new ItemOptionsJoiSchema(joi),
  messageSchema = new MessageJoiSchema(joi, generalSchema),
  orderSchema = new OrderJoiSchema(joi),
  profileSchema = new ProfileJoiSchema(joi, generalSchema),
  userSchema = new UserJoiSchema(joi, generalSchema),
  eventSchema = new EventJoiSchema(joi),
  missionSchema = new MissionJoiSchema(joi, generalSchema),
  bidSchema = new BidJoiSchema(joi),
  profileReviewSchema = new ProfileReviewJoiSchema(joi, generalSchema),
  fileSchema = new FileJoiSchema(joi),
  categorySchema = new CategoryJoiSchema(joi, generalSchema),
  pickupLocationSchema = new PickupLocationJoiSchema(joi, generalSchema),
  deliveryEventSchema = new DeliveryEventJoiSchema(joi),
  problemReportSchema = new ProblemReportJoiSchema(joi),
  // controllers:
  userController = new UserController(userService, profileService, responses, hashingService, responseService),
  campaignController = new CampaignController(campaignService, itemService, responses, generalModelService, responseService),
  itemController = new ItemController(itemService, campaignService, profileService, itemOptionsService, responses, responseService, generalModelService),
  messageController = new MessageController(messageService, responseService, profileService, orderService),
  orderController = new OrderController(responseService, orderService, orderChecker),
  transactionController = new TransactionController(transactionService, responseService, responses),
  profileController = new ProfileController(profileService, userService, generalModelService, responseService, responses, itemService),
  itemReviewController = new ItemReviewController(itemService, itemReviewService, responseService, generalModelService, orderService),
  itemOptionsController = new ItemOptionsController(itemOptionsService, responses, responseService),
  profileSubscriptionController = new ProfileSubscriptionController(profileService, profileSubscriptionService, responses, responseService),
  eventController = new EventController(eventService, eventChecker, responseService),
  userEventController = new UserEventController(userEventService, userEventChecker, responseService),
  categoryController = new CategoryController(responses, categoryService, responseService),
  missionController = new MissionController(missionService, responses, responseService, generalModelService),
  bidController = new BidController(bidService, responses, responseService, missionService),
  profileReviewController = new ProfileReviewController(profileService, profileReviewService, responses, responseService, orderService),
  fileController = new FileController(fileService, responseService, responses, uploadMiddleware.single('file'), logger),
  rootController = new RootController(responseService),
  logController = process.env.ACCESSIBSLE_LOG_PATH ? new LogController(fileReaderService, responseService, logger, process.env.ACCESSIBSLE_LOG_PATH) : null,
  pickupLocationController = new PickupLocationController(pickupLocationService, responseService, responses),
  deliveryEventController = new DeliveryEventController(deliveryEventService, responseService, responses),
  problemReportController = new ProblemReportController(problemReportService, responseService, responses),
  // middleware:
  validationMiddleware = new ValidationMiddleware(joi, responseService),
  authMiddleware = new AuthMiddleware(passport, profileService, responseService, responses),
  stripeMiddleware = new StripeMiddleware(stripeGateway, process.env.STRIPE_WEBHOOK_ENDPOINT_SECRET, responseService);
// routers:
new CampaignRoutes(app, campaignController, validationMiddleware, authMiddleware, campaignSchema, generalSchema);
new ItemRoutes(app, itemController, validationMiddleware, authMiddleware, itemSchema, generalSchema);
new ItemOptionsRoutes(app, itemOptionsController, validationMiddleware, authMiddleware, itemOptionsSchema, generalSchema);
new ItemReviewRoutes(app, itemReviewController, validationMiddleware, authMiddleware, itemReviewSchema, generalSchema);
new MessageRoutes(app, messageController, validationMiddleware, authMiddleware, messageSchema);
new OrderRoutes(app, orderController, validationMiddleware, authMiddleware, stripeMiddleware, orderSchema, generalSchema);
new ProfileRoutes(app, profileController, validationMiddleware, authMiddleware, profileSchema, generalSchema);
new UserRoutes(app, userController, validationMiddleware, authMiddleware, userSchema, profileSchema, generalSchema);
new ProfileSubscriptionRoutes(app, profileSubscriptionController, validationMiddleware, authMiddleware, generalSchema);
new TransactionRoutes(app, transactionController, validationMiddleware, authMiddleware, generalSchema);
new EventRoutes(app, eventController, eventSchema, validationMiddleware, authMiddleware, generalSchema);
new UserEventRoutes(app, userEventController, eventSchema, validationMiddleware, authMiddleware, generalSchema);
new CategoryRoutes(app, categoryController, validationMiddleware, authMiddleware, generalSchema, categorySchema);
new MissionRoutes(app, missionController, validationMiddleware, authMiddleware, missionSchema, generalSchema);
new BidRoutes(app, bidController, validationMiddleware, authMiddleware, bidSchema, generalSchema);
new ProfileReviewRoutes(app, profileReviewController, validationMiddleware, authMiddleware, profileReviewSchema, generalSchema);
new FileRoutes(app, fileController, validationMiddleware, authMiddleware, fileSchema, generalSchema);
new PickupLocationRoutes(app, pickupLocationController, validationMiddleware, authMiddleware, pickupLocationSchema, generalSchema);
new DeliveryEventRoutes(app, deliveryEventController, validationMiddleware, authMiddleware, deliveryEventSchema, generalSchema);
new ProblemReportRoutes(app, problemReportController, validationMiddleware, authMiddleware, problemReportSchema, generalSchema);
new RootRoutes(app, rootController);

if (process.env.ACCESSIBSLE_LOG_PATH) {
  new LogRoutes(app, logController);
}
// -------------- /INSTANCES --------------

// ----------- RUN MIGRATIONS: -------------
const migrations: MigrationIF[] = [
  // new MakeUsersAdminMigration(userService)
  // new DeleteItemsWithoutOwner(itemService)
];
logger.important('server.js', 'Running ' + migrations.length + ' migrations');
migrations.forEach((migration) => migration.doMigration());

// ----------- /RUN MIGRATIONS -------------
console.log('----------- Initialized with routes: ----------- ');
console.log(JSON.stringify(app._router.stack.map((route) => route?.route?.path).filter((route) => !!route)));

const DEV_MODE = 'production';

if ((DEV_MODE as string) == (DevMode.PROD as string) || (DEV_MODE as string) == (DevMode.STAGING as string)) {
  app.listen(process.env.SERVER_PORT, function () {
    logger.important('server.js', 'API up on port: ' + process.env.SERVER_PORT);
  });
} else {
  app.listen(process.env.SERVER_PORT, function () {
    logger.important('server.js', 'API up on port: ' + process.env.SERVER_PORT);
  });
}
