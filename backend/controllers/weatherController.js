import fetch from "node-fetch";
import queryString from "query-string";
import moment from "moment";

async function getWeatherData(long, lat) {
  // set the Timelines GET endpoint as the target URL
  const getTimelineURL = "https://api.tomorrow.io/v4/timelines";

  // get your key from app.tomorrow.io/development/keys
  const apikey = process.env.TOMORROW_API_KEY;

  // pick the location, as a latlong pair (longitude, latitude)
  const location = [long, lat];

  // list the fields
  const fields = [
    "precipitationIntensity",
    "precipitationType",
    "windSpeed",
    "windGust",
    "windDirection",
    "temperature",
    "temperatureApparent",
    "cloudCover",
    "cloudBase",
    "cloudCeiling",
    "weatherCode",
  ];

  // choose the unit system, either metric or imperial
  const units = "metric";

  // set the timesteps, like "current", "1h" and "1d"
  const timesteps = ["current"];

  // configure the time frame up to 6 hours back and 15 days out
  const now = moment.utc();
  const startTime = moment.utc(now).add(0, "minutes").toISOString();
  const endTime = moment.utc(now).add(1, "days").toISOString();

  // specify the timezone, using standard IANA timezone format
  const timezone = "America/New_York";

  // request the timelines with all the query string parameters as options
  const getTimelineParameters = queryString.stringify(
    {
      apikey,
      location,
      fields,
      units,
      timesteps,
      startTime,
      endTime,
      timezone,
    },
    { arrayFormat: "comma" }
  );

  const result = await fetch(getTimelineURL + "?" + getTimelineParameters, {
    method: "GET",
    compress: true,
  });

  return result.json();
}

function interperateData(data) {
  if (data.temperature >= 28) {
    //Hot Weather
    return 1;
  } else if (data.temperature <= 14) {
    //"Cold Weather"
    return 2;
  } else if (data.precipitationIntensity > 0 && data.precipitationType === 1) {
    //"Rainy Weather"
    return 3;
  } else if (data.windSpeed >= 15 || data.windGust >= 25) {
    //"Windy Weather"
    return 4;
  } else {
    //"Normal Weather"
    return 5;
  }
}
export const getWeather = async (req, res) => {
  try {
    const { long, lat } = req.body || {};

    if (
      typeof long === "undefined" ||
      typeof lat === "undefined" ||
      Number.isNaN(Number(long)) ||
      Number.isNaN(Number(lat))
    ) {
      return res.status(400).json({ error: "Missing or invalid long/lat" });
    }

    const data = await getWeatherData(Number(long), Number(lat));
    const value = interperateData(data.data.timelines[0].intervals[0].values);
    return res.json(value);
  } catch (e) {
    console.error("getWeather error:", e);
    return res.status(500).json({ error: "Failed to get weather" });
  }
};
