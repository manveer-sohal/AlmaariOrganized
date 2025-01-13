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
      <div
        className={`w-full h-96 flex items-center justify-center ${weather} transition-all duration-500 ease-in-out`}
      >
        <div className="text-xl animations-semibold p-4 text-center ">
          {error && <p className="text-red-500">{error}</p>}
          {loading ? (
            <p>Loading weather information...</p>
          ) : (
            <>
              {weather === "bg-slate-300" && (
                <p>Check the Weather in your Location!</p>
              )}
              {weather === "bg-blue-400" && (
                <>
                  <DotLottieReact src="/animations/cold.lottie" loop autoplay />
                  <p>It’s cold, wear something warm!</p>
                </>
              )}
              {weather === "bg-yellow-400" && (
                <p>It’s hot, wear something light!</p>
              )}
              {weather === "bg-blue-300" && (
                <p>It’s windy, wear something warm!</p>
              )}
              {weather === "bg-slate-200" && (
                <>
                  <DotLottieReact src="/animations/rain.lottie" loop autoplay />
                  <p>It’s rainy, wear a hoodie!</p>
                </>
              )}
              {weather === "bg-blue-100" && (
                <p>It’s nice out! Wear whatever!</p>
              )}
            </>
          )}
        </div>
      </div>
      <button
        onClick={getWeather}
        className="w-full block font-semibold text-lg px-5 py-2 rounded-3xl m-1 cursor-pointer hover:bg-indigo-500 active:bg-purple-600 hover:text-white transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
        disabled={loading}
      >
        {loading ? "Fetching..." : "Get Weather"}
      </button>
    </>
  );
}
