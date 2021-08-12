import ResponseService from "../services/ResponseService";

export default class RootController {
    private date;
    private responseService: ResponseService;

    constructor(responseService: ResponseService) {
        this.date = Date.now();
        this.responseService = responseService;
    }

    calcUpTime(date_started) {
        // get total seconds between the times
        let delta = Math.abs(Date.now() - date_started) / 1000;

        // calculate (and subtract) whole days
        let days = Math.floor(delta / 86400);
        delta -= days * 86400;

        // calculate (and subtract) whole hours
        let hours = Math.floor(delta / 3600) % 24;
        delta -= hours * 3600;

        // calculate (and subtract) whole minutes
        let minutes = Math.floor(delta / 60) % 60;
        delta -= minutes * 60;

        // what's left is seconds
        let seconds = delta % 60;  // in theory the modulus is not required
        return {
            days: days,
            hours: hours,
            minutes: minutes,
            seconds: Math.floor(seconds)
        }
    }

    root(req, res) {
        this.responseService.respond(res, 200, {
            description: "Backend REST API",
            start_timestamp: this.date,
            start_timestamp_readable: new Date(this.date).toString(),
            up_time: this.calcUpTime(this.date)
        });
    }
}