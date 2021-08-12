/**
* Module containing standardized query-operation services  (NOTE: PERHAPS DOING TOO MANY THINGS, CONSIDER SPLITTING INTO ENTITY-SPECIFIC MODULES)
*/
export default class QueryService {

  /**
  * Standardized function for performiong limit,skip and sort on a given query
  * with multiple items in result.
  * @param Query-builder to perform on
  * @param Request
  */
  orderByOffsetLimit(req, query) {
    if (req.limit) {
      query = query.limit(parseInt(req.limit));
    }
    if (req.offset) {
      query = query.skip(parseInt(req.offset));
    }
    if (req.sort && req.sort != "GPS_DISTANCE") {
      query = query.sort(req.sort);
    }
    return query;
  }

  /**
* Standardized function for filtering only objects owned by given profile-id (OPTIONAL - ONLY IF IN REQUEST)
* @param Query-builder to perform on
* @param Request
*/
  filterOwnerProfile(req, query) {
    if (req.owner_profile && req.owner_profile.toString().startsWith("!")) {
      return query.find({ owner_profile: { "$ne": req.owner_profile.substr(1) } });
    }
    if (req.owner_profile) {
      return query.find({ owner_profile: req.owner_profile });
    }
    return query;
  }


  /**
  * Standardized function for filtering only objects owned by given user-id (OPTIONAL - ONLY IF IN REQUEST)
  * @param Query-builder to perform on
  * @param Request
  */
  filterOwnerUser(req, query) {
    if (req.owner_user && req.owner_user.toString().startsWith("!")) {
      return query.find({ owner_user: { "$ne": req.owner_user.substr(1) } });
    }
    if (req.owner_user) {
      return query.find({ owner_user: req.owner_user });
    }
    return query;
  }

  /**
  * Standardized function for filtering only objects that are active
  * @param Query-builder to perform on
  * @param Request
  */
  filterActive(req, query) {
    return query.find({ active: true });
  }

  /**
 * Standardized function for filtering only objects that are listed
 * @param Query-builder to perform on
 * @param Request
 */
  filterListed(req, query) {
    return query.find({ listed: true });
  }

  /**
* Standardized function for filtering only objects that are listed
* @param Query-builder to perform on
* @param Request
*/
  filterListed_optional(req, query) {
    if (req.listed == true) {
      return query.find({ listed: true });
    }
    if (req.listed == false) {
      return query.find({ listed: false });
    }
    return query;
  }

  /**
  * Standardized function for filtering active or not from request
  * @param Query-builder to perform on
  * @param Request
  */
  filterActive_optional(req, query) {
    if (req.active == true) {
      return query.find({ active: true });
    }
    if (req.active == false) {
      return query.find({ active: false });
    }
    return query;
  }

  /**
  * Filters result by campaign field (ex: for items)
  * @param Query-builder to perform on
  * @param Request
  */
  filterCampaign(req, query) {
    if (req.id) {
      return query.find({ campaign: { _id: req.id } });
    }
    return query;
  }

  /**
  * Filters result by campaign field (ex: for items)
  * @param Array of attributes allowed to populate
  * @param Query-builder to perform on
  * @param Request
  */
  populateFields(allowed: string[], req, query) {
    let q = query;
    if (req.populate && req.populate.length > 0) {
      const for_populate: string[] = req.populate.filter((field: string) => allowed.includes(field));
      if (for_populate.length < req.populate.length) {
        throw { code: 400, message: { error: "Unknown populate fields", unknown_fields: req.populate.filter(field => !for_populate.includes(field)), supported_fields: allowed } }
      }
      for_populate.forEach((field: string) => {
        const path: string[] = field.split(".");
        q = q.populate({ path: path[0], ...(path.length > 1 ? { populate: { path: path[1] } } : {}) });
      });
    }
    return q;
  }

  /**
* Filters result by item field
* @param Query-builder to perform on
* @param Request
*/
  filterItem(req, query) {
    if (req.id) {
      return query.find({ item: { _id: req.id } });
    }
    return query;
  }

  /**
   * Filters by given type
   * @param req 
   * @param query 
   */
  filterType(req, query) {
    if (req.type) {
      return query.find({ type: req.type });
    }
    return query;
  }

  /**
   * Orders results by proximity to a gps location, and allows a max-distance in meters to be set
   * @param req 
   * @param query 
   */
  sortByNear(req, query) {
    if (req.lat && req.long && req.sort == "GPS_DISTANCE") {
      return query.find({
        "location.coordinates": {
          "$near": {
            ...(req.max_distance ? { "$maxDistance": req.max_distance } : {}),
            "$geometry": {
              "type": "Point",
              "coordinates": [req.long, req.lat]
            }
          }
        }
      });
    }
    return query;
  }

  /**
   * Filters elements within given max distance
   * @param req 
   * @param query 
   */
  filterNear(req, query) {
    if (req.max_distance && req.lat && req.long && req.sort != "GPS_DISTANCE") {
      const distanceInKilometer = Number(req.max_distance / 1000),
        radius = distanceInKilometer / 6378.1; // (convert distance to radius as per mongodb docs)
      return query.find({
        location: { $geoWithin: { $centerSphere: [[req.long, req.lat], radius] } },
      });
    }
    return query;
  }

  /**
  * Ensures that current user is in the participants array of the given objects
  * @param Query-builder to perform on
  * @param Request
  */
  filterParticipant_current(req, query) {
    if (req.participant) {
      return query.find({ participants: { _id: req.profile._id } })
    }
    return query;
  }

  /**
  * Ensures that a given user is a participant of the conversation
  * @param Query-builder to perform on
  * @param Request (require_participant is the id of a given user)
  */
  filterParticipant(req, query) {
    if (req.participant) {
      return query.find({ participants: { _id: req.require_participant } })
    }
    return query;
  }

  /**
  * Filters by a given category (ex: for campaigns)
  * @param Query-builder to perform on
  * @param Request
  */
  filterCategory(req, query) {
    if (req.category) {
      return query.find({ category: req.category });
    }
    return query;
  }

  /**
* Filters by a given category (ex: for campaigns)
* @param Query-builder to perform on
* @param Request
*/
  filterHasCategory(req, query) {
    if (req.hasCategory) {
      return query.find({ categories: req.hasCategory });
    }
    return query;
  }

  /**
  * Applies a text search filter to a given attribute (such as campaign title)
  * @param Query-builder to perform on
  * @param Request
  */
  filterSearch(field, req, query) {
    if (req.search) {
      let q = {};
      q[field] = { $regex: '.*' + req.search + '.*', $options: 'i' }; // dynamically set key to search for (from the field variable)
      return query.find(q);
    } else {
      return query;
    }
  }

  /**
  * Filters objects by newer than
  * @param Query-builder to perform on
  * @param Request
  */
  filterNewerThan(req, query) {
    if (req.newer_than) {
      const date = new Date(req.newer_than);
      return query.find({ created_at: { $gt: date } });
    }
    return query;
  }

  /**
  * Filters objects by newer than
  * @param Query-builder to perform on
  * @param Request
  */
  filterOlderThan(req, query) {
    if (req.older_than) {
      const date = new Date(req.older_than);
      return query.find({ created_at: { $lt: date } });
    }
    return query;
  }

  /**
* Filters objects that are not soft-deleted
* @param Query-builder to perform on
* @param Request
*/
  filterNotDeleted(req, query) {
    return query.find({ deleted: { $ne: true } });
  }

  /**
   * Filters only profiles that have more than 0 items
   * @param req 
   * @param query 
   */
  filterHasItems(req, query) {
    if (req.has_items) {
      return query.find({ number_of_items: { $gt: 0 } });
    }
    return query;
  }

  /**
   * Filters only profiles that have more than 0 campaigns
   * @param req 
   * @param query 
   */
  filterHasCampaigns(req, query) {
    if (req.has_campaigns) {
      return query.find({ number_of_campaigns: { $gt: 0 } });
    }
    return query;
  }

  filterSeller(req, query) {
    if (req.seller && req.seller.toString().startsWith("!")) {
      return query.find({ seller: { "$ne": req.seller.substr(1) } });
    }
    if (req.seller) {
      return query.find({ seller: { _id: req.seller } });
    }
    return query;
  }

  filterSender(req, query) {
    if (req.sender && req.sender.toString().startsWith("!")) {
      return query.find({ sender: { "$ne": req.sender.substr(1) } });
    }
    if (req.sender) {
      return query.find({ sender: { _id: req.sender } });
    }
    return query;
  }

  filterReceiver(req, query) {
    if (req.receiver && req.receiver.toString().startsWith("!")) {
      return query.find({ receiver: { "$ne": req.receiver.substr(1) } });
    }
    if (req.receiver) {
      return query.find({ receiver: { _id: req.receiver } });
    }
    return query;
  }

  filterHasParticipant(req, query) {

    if (req.hasParticipant) {
      return query.find({
        participants: req.hasParticipant,
      })
    }
    return query;
  }

  filterBuyer(req, query) {
    if (req.buyer && req.buyer.toString().startsWith("!")) {
      return query.find({ buyer: { "$ne": req.buyer.substr(1) } });
    }
    if (req.buyer) {
      return query.find({ buyer: { _id: req.buyer } });
    }
    return query;
  }

  filterStatus(req, query) {
    if (req.status && req.status.length > 0) {
      return query.find({ status: { $in: req.status } });
    }
    return query;
  }

  filterPaid(req, query) {
    if (req.paid) {
      return query.find({ paid: req.paid });
    }
    return query;
  }

};
