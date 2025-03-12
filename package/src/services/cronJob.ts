/**
 * Cron jobs needed (we are using nodejs built in interval for the jobs)
 *
 * 1. job to retrieve settings from telex app at intervals every 3 minutes
 * 2. job to run monitoring check at interval (this would utilize a queue mechanism , just implement the interval job) this job should run every n minute , where n is the value of interval specified by the user in the settings
 */
