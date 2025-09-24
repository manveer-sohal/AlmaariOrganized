import { useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function WeatherCheck() {
  const [weather, setWeather] = useState<string>("bg-slate-300");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const getWeather = async () => {
    setLoading(true);
    setError(null); // Reset error state

    const colour = (data: number) => {
      if (data === 1) {
        setWeather("bg-yellow-400"); // Hot
      } else if (data === 2) {
        setWeather("bg-blue-400"); // Cold
      } else if (data === 3) {
        setWeather("bg-blue-300"); // Windy
      } else if (data === 4) {
        setWeather("bg-slate-200"); // Rainy
      } else {
        setWeather("bg-blue-100"); // Normal
      }
    };

    try {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const long = position.coords.longitude;

          const location = { lat, long };

          const response = await fetch(
            `${API_BASE_URL}/api/weather/getWeather` ||
              "http://localhost:3001/api",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(location),
            }
          );

          if (!response.ok) {
            throw new Error("Failed to fetch weather data.");
          }

          const data = await response.json();
          colour(data);
        },
        (err) => {
          setError("Location access denied. Please enable location services.");
          console.error(err);
        }
      );
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Something went wrong. Please try again.");
      } else {
        setError("An unexpected error occurred.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="w-full bg-white/80 backdrop-blur border border-indigo-200 rounded-xl p-3 m-1 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="inline-flex items-center gap-2 text-indigo-900">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="font-medium">Weather</span>
          </div>
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-indigo-200 text-indigo-900 bg-indigo-50">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-400" />
            Status
          </span>
        </div>

        <div
          className={`w-full h-28 rounded-lg border border-indigo-100 flex items-center justify-center overflow-hidden ${weather} transition-all duration-500 ease-in-out`}
        >
          <div className="text-center px-3">
            {error && <p className="text-red-600 text-sm">{error}</p>}
            {loading ? (
              <p className="text-indigo-900">Loading weather information...</p>
            ) : (
              <>
                {weather === "bg-slate-300" && (
                  <p className="text-indigo-900">
                    Check the weather in your location
                  </p>
                )}
                {weather === "bg-blue-400" && (
                  <div className="flex flex-col items-center justify-center">
                    <DotLottieReact
                      src="/animations/cold.lottie"
                      loop
                      autoplay
                      style={{ width: 64, height: 64 }}
                    />
                    <p className="text-indigo-900 mt-1">
                      It’s cold, wear something warm
                    </p>
                  </div>
                )}
                {weather === "bg-yellow-400" && (
                  <p className="text-indigo-900">
                    It’s hot, wear something light
                  </p>
                )}
                {weather === "bg-blue-300" && (
                  <p className="text-indigo-900">
                    It’s windy, wear something warm
                  </p>
                )}
                {weather === "bg-slate-200" && (
                  <div className="flex flex-col items-center justify-center">
                    <DotLottieReact
                      src="/animations/rain.lottie"
                      loop
                      autoplay
                      style={{ width: 64, height: 64 }}
                    />
                    <p className="text-indigo-900 mt-1">
                      It’s rainy, wear a hoodie
                    </p>
                  </div>
                )}
                {weather === "bg-blue-100" && (
                  <p className="text-indigo-900">
                    It’s nice out! Wear whatever
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <button
          onClick={getWeather}
          className="w-full inline-flex items-center justify-center gap-2 font-medium text-base px-4 py-2 rounded-xl mt-3 cursor-pointer border bg-indigo-100/70 text-indigo-900 border-indigo-200 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
                ></path>
              </svg>
              Fetching...
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M17 18a5 5 0 1 0-5-5M3 18h14M3 14h8M3 10h6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Get Weather
            </span>
          )}
        </button>
      </div>
    </>
  );
}
