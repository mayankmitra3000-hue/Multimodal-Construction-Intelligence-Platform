import { useState, type FormEvent } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSun,
  Cloudy,
  Droplets,
  Gauge,
  Sun,
  Thermometer,
  Wind,
  XCircle,
} from "lucide-react";

import { api } from "../api/client";
import {
  Alert,
  Badge,
  BulletList,
  Button,
  Card,
  EmptyState,
  Field,
  JsonViewer,
  LoadingResult,
  MetaBar,
  PageHeader,
  Select,
  Stat,
  TextInput,
} from "../components/ui";
import { useAsyncAction } from "../lib/useAsyncAction";
import { formatDate, formatNumber, splitList, titleCase, toDateInput } from "../lib/format";
import type { DayForecast, Suitability, WeatherResponse } from "../types";

function ForecastIcon({ condition, size = 26 }: { condition: string; size?: number }) {
  const value = condition.toLowerCase();
  if (value.includes("thunder")) return <CloudLightning size={size} />;
  if (value.includes("heavy rain")) return <CloudRain size={size} />;
  if (value.includes("rain")) return <CloudRain size={size} />;
  if (value.includes("wind")) return <Wind size={size} />;
  if (value.includes("partly")) return <CloudSun size={size} />;
  if (value.includes("cloud")) return <Cloud size={size} />;
  if (value.includes("sun") || value.includes("clear")) return <Sun size={size} />;
  return <Cloudy size={size} />;
}

function suitabilityTone(value: Suitability): "green" | "amber" | "red" {
  return value === "good" ? "green" : value === "caution" ? "amber" : "red";
}

function SuitabilityIcon({ value }: { value: Suitability }) {
  if (value === "good") return <CheckCircle2 size={18} />;
  if (value === "caution") return <AlertTriangle size={18} />;
  return <XCircle size={18} />;
}

export default function WeatherAdvisory() {
  const [location, setLocation] = useState("Manchester, UK");
  const [startDate, setStartDate] = useState(toDateInput());
  const [days, setDays] = useState("5");
  const [trade, setTrade] = useState("Concrete");
  const [activities, setActivities] = useState(
    "Concrete placement, Steel erection, Painting",
  );
  const [formError, setFormError] = useState<string | null>(null);
  const { data, loading, error, run } = useAsyncAction<WeatherResponse>();

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (location.trim().length < 2) {
      setFormError("Enter a location.");
      return;
    }
    setFormError(null);
    await run(() =>
      api.weather({
        location: location.trim(),
        start_date: startDate || null,
        days: Number(days),
        trade: trade || null,
        activities: splitList(activities),
      }),
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Context · Weather risk"
        title="Weather-Aware Advisory"
        description="Rate planned activities against an estimated outlook, then adjust the sequence before weather costs you a shift."
        actions={<Badge tone="amber">AI-estimated forecast</Badge>}
      />

      <div className="workspace">
        <Card title="Work window" subtitle="Tell us where and what you plan to do.">
          <form onSubmit={submit} className="form-stack">
            <Field label="Location" htmlFor="weather-location">
              <TextInput
                id="weather-location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </Field>
            <div className="form-grid">
              <Field label="Start date" htmlFor="weather-start">
                <TextInput
                  id="weather-start"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </Field>
              <Field label="Outlook days" htmlFor="weather-days">
                <Select
                  id="weather-days"
                  value={days}
                  onChange={(event) => setDays(event.target.value)}
                >
                  {[3, 5, 7].map((value) => (
                    <option value={value} key={value}>
                      {value} days
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Primary trade" htmlFor="weather-trade" className="span-2">
                <TextInput
                  id="weather-trade"
                  value={trade}
                  onChange={(event) => setTrade(event.target.value)}
                  placeholder="Concrete, steel, roofing, finishes..."
                />
              </Field>
              <Field
                label="Activities to rate"
                htmlFor="weather-activities"
                hint="Comma-separated. Leave blank for defaults."
                className="span-2"
              >
                <TextInput
                  id="weather-activities"
                  value={activities}
                  onChange={(event) => setActivities(event.target.value)}
                />
              </Field>
            </div>
            <Alert tone="info" title="Estimated, not live">
              The outlook is AI-generated for planning. Always confirm against an official
              meteorological service before high-risk work.
            </Alert>
            {formError ? <Alert tone="danger">{formError}</Alert> : null}
            <Button type="submit" loading={loading} icon={<CloudSun size={16} />} full>
              Get weather advisory
            </Button>
          </form>
        </Card>

        <div className="result-column">
          {error ? (
            <Alert tone="danger" title="Advisory failed">
              {error}
            </Alert>
          ) : null}
          {loading ? (
            <Card>
              <LoadingResult label="Assessing the work window" />
            </Card>
          ) : data ? (
            <WeatherResult data={data} />
          ) : (
            <Card>
              <EmptyState
                icon={<CloudSun size={26} />}
                title="No forecast yet"
                description="Set a location and activities to see suitability ratings and advisories."
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function WeatherResult({ data }: { data: WeatherResponse }) {
  const avgPrecip = Math.round(
    data.outlook.reduce((sum, day) => sum + day.precipitation_chance, 0) /
      Math.max(1, data.outlook.length),
  );
  const maxWind = Math.max(...data.outlook.map((day) => day.wind_kph));
  const lowTemp = Math.min(...data.outlook.map((day) => day.temp_min_c));
  const first = data.outlook[0];
  const last = data.outlook[data.outlook.length - 1];

  return (
    <div className="result-stack">
      <Card
        title={`Outlook · ${data.location}`}
        subtitle={
          first && last
            ? `${formatDate(first.date)} – ${formatDate(last.date)} · ${data.outlook.length} day window`
            : "Estimated outlook"
        }
        actions={<Badge tone="amber" dot>AI estimate</Badge>}
      >
        <div className="forecast-strip">
          {data.outlook.map((day: DayForecast) => (
            <div className="forecast-day" key={day.date}>
              <span>{formatDate(day.date)}</span>
              <div className="forecast-icon">
                <ForecastIcon condition={day.condition} />
              </div>
              <strong>
                {Math.round(day.temp_min_c)}° / {Math.round(day.temp_max_c)}°
              </strong>
              <small>{day.condition}</small>
              <div className="forecast-meta">
                <span>
                  <Droplets size={12} /> {day.precipitation_chance}%
                </span>
                <span>
                  <Wind size={12} /> {Math.round(day.wind_kph)} kph
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="result-stats">
          <Stat label="Avg. rain chance" value={`${avgPrecip}%`} tone={avgPrecip > 50 ? "red" : "blue"} />
          <Stat label="Peak wind" value={`${Math.round(maxWind)} kph`} tone={maxWind > 35 ? "red" : "default"} />
          <Stat label="Lowest temp" value={`${formatNumber(lowTemp, 1)} °C`} tone={lowTemp < 5 ? "amber" : "green"} />
        </div>
      </Card>

      <Card title="Activity suitability" subtitle="Schedule the right work in the right window.">
        <div className="suitability-list">
          {data.suitability.map((item) => (
            <article
              key={item.activity}
              className={`suitability suitability-${item.suitability}`}
            >
              <div className="suitability-icon">
                <SuitabilityIcon value={item.suitability} />
              </div>
              <div className="suitability-main">
                <div>
                  <h3>{item.activity}</h3>
                  <Badge tone={suitabilityTone(item.suitability)}>
                    {titleCase(item.suitability)}
                  </Badge>
                </div>
                <p>{item.reason}</p>
                <span className="best-window">Best window · {item.best_window}</span>
              </div>
            </article>
          ))}
        </div>
      </Card>

      <Alert tone="warning" title={data.data_note}>
        Use this window for planning only; confirm with a live meteorological source.
      </Alert>

      <div className="split-results">
        <Card title="Advisories" subtitle="What to prepare for.">
          <div className="icon-list">
            {data.advisories.map((item) => (
              <div key={item}>
                <Gauge size={14} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Safety notes">
          <BulletList items={data.safety_notes} />
        </Card>
      </div>

      <Card title="Schedule impact" subtitle="Recommended response.">
        <div className="impact-strip">
          <Thermometer size={20} />
          <p>{data.schedule_impact}</p>
        </div>
      </Card>

      <Card title="Response metadata" subtitle="Contract provenance and quality signals.">
        <MetaBar meta={data.meta} />
        <JsonViewer data={data} />
      </Card>
    </div>
  );
}
