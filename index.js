require("dotenv").config();
const { WakaTimeClient } = require("wakatime-client");
const { endOfYesterday, formatISO, format, parseISO } = require("date-fns");
const { GoogleSpreadsheet } = require("google-spreadsheet");

const private_key = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");
const {
  WAKATIME_API_KEY: wakatimeApiKey,
  GOOGLE_SHEETS_ID: googleSheetId,
  GOOGLE_SERVICE_ACCOUNT_EMAIL: client_email,
} = process.env;

const wakatime = new WakaTimeClient(wakatimeApiKey);
const doc = new GoogleSpreadsheet(googleSheetId);
const yesterday = formatISO(endOfYesterday(), {
  // assuming the job is runnig on second day
  representation: "date",
});
const parsedDate = parseISO(yesterday);
const day = format(parsedDate, "EEEE");


async function main() {
  console.log("Initialising");
  // initialise
  await initGoogleSheet();
  const { languages = [], projects = [] } = await getYesterdaySummary();
  await addProjectRows(projects);
  await addLanguagesRows(languages);
}

async function getYesterdaySummary() {
  console.log("INIT: fetching data from wakatime");

  const summary = await wakatime.getMySummary({
    dateRange: {
      startDate: yesterday,
      endDate: yesterday,
    },
  });
  const { languages, projects } = summary.data[0];
  console.log("DONE: fetching data from wakatime");
  return { languages, projects };
}

async function initGoogleSheet() {
  console.log("INIT: initialising google doc");
  await doc.useServiceAccountAuth({
    client_email: client_email,
    private_key: private_key,
  });
  await doc.loadInfo();
  console.log("COMPLETED: initialising google doc");

}

async function addProjectRows(projects = []) {
  if (!projects.length) return;
  console.log("INIT: logging project data to google sheets");
  // append date in dd-MM-yyyy formate
  const date = format(parsedDate, "dd-MM-yyyy");
  projects = projects.map((p) => Object.assign(p, { date, day }));

  // insert data to sheet
  const sheet = doc.sheetsByIndex[0];
  await sheet.loadHeaderRow();
  await sheet.addRows(projects, { insert: true });
  console.log("COMPLETED: logging project data to google sheets");
}

async function addLanguagesRows(languages = []) {
  console.log("INIT: logging langauges data to google sheets");
  if (!languages.length) return;
  // append date in dd-MM-yyyy formate
  let parsedDate = parseISO(yesterday);
  const date = format(parsedDate, "dd-MM-yyyy");
  languages = languages.map((p) => Object.assign(p, { date, day }));

  // insert data to sheet
  const sheet = doc.sheetsByIndex[1];
  await sheet.loadHeaderRow();
  await sheet.addRows(languages, { insert: true });
  console.log("COMPLETED: logging langauges data to google sheets");
}

(async () => {
  await main();
})();
