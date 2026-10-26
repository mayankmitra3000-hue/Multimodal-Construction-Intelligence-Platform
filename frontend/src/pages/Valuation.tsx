import { useState, type FormEvent } from "react";
import { Building2, LineChart, TrendingDown, TrendingUp, Minus } from "lucide-react";

import { api } from "../api/client";
import {
  Alert,
  Badge,
  BulletList,
  Button,
  Card,
  ConfidenceBar,
  EmptyState,
  Field,
  JsonViewer,
  LoadingResult,
  MetaBar,
  PageHeader,
  Select,
  Stat,
  TextArea,
  TextInput,
} from "../components/ui";
import { useAsyncAction } from "../lib/useAsyncAction";
import { formatMoneyRange, formatNumber, splitList, titleCase } from "../lib/format";
import type { Condition, PropertyType, ValuationResponse } from "../types";

const propertyTypes: PropertyType[] = [
  "apartment",
  "house",
  "villa",
  "commercial",
  "industrial",
  "land",
];

const conditions: Condition[] = ["excellent", "good", "fair", "poor"];

const currencies = ["USD", "EUR", "GBP", "AED", "SAR", "INR", "ZAR", "CAD", "AUD"];

export default function Valuation() {
  const [location, setLocation] = useState("Downtown Dubai");
  const [propertyType, setPropertyType] = useState<PropertyType>("apartment");
  const [area, setArea] = useState("120");
  const [age, setAge] = useState("4");
  const [condition, setCondition] = useState<Condition>("excellent");
  const [bedrooms, setBedrooms] = useState("2");
  const [bathrooms, setBathrooms] = useState("2");
  const [amenities, setAmenities] = useState("gym, pool, covered parking");
  const [currency, setCurrency] = useState("AED");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const { data, loading, error, run } = useAsyncAction<ValuationResponse>();

  async function submit(event: FormEvent) {
    event.preventDefault();
    const areaValue = Number(area);
    const ageValue = Number(age);
    if (location.trim().length < 2) {
      setFormError("Enter a location with at least two characters.");
      return;
    }
    if (!Number.isFinite(areaValue) || areaValue <= 0) {
      setFormError("Area must be a positive number.");
      return;
    }
    if (!Number.isFinite(ageValue) || ageValue < 0) {
      setFormError("Age must be zero or more.");
      return;
    }
    setFormError(null);
    await run(() =>
      api.valuation({
        location: location.trim(),
        property_type: propertyType,
        area_sqm: areaValue,
        age_years: ageValue,
        condition,
        bedrooms: bedrooms ? Number(bedrooms) : null,
        bathrooms: bathrooms ? Number(bathrooms) : null,
        amenities: splitList(amenities),
        currency,
        notes: notes || null,
      }),
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Structured data · Valuation"
        title="Real Estate Valuation"
        description="Model a defensible value range from property attributes, condition, age, amenities, and location context."
        actions={<Badge tone="blue">Hedonic reasoning</Badge>}
      />

      <div className="workspace">
        <Card title="Property profile" subtitle="The more accurate the attributes, the tighter the range.">
          <form onSubmit={submit} className="form-stack">
            <div className="form-grid">
              <Field label="Location" htmlFor="val-location" className="span-2">
                <TextInput
                  id="val-location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="City, district, or full address"
                />
              </Field>
              <Field label="Property type" htmlFor="val-type">
                <Select
                  id="val-type"
                  value={propertyType}
                  onChange={(event) => setPropertyType(event.target.value as PropertyType)}
                >
                  {propertyTypes.map((type) => (
                    <option value={type} key={type}>
                      {titleCase(type)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Currency" htmlFor="val-currency">
                <Select
                  id="val-currency"
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value)}
                >
                  {currencies.map((code) => (
                    <option value={code} key={code}>
                      {code}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Area (m²)" htmlFor="val-area">
                <TextInput
                  id="val-area"
                  type="number"
                  min="1"
                  step="1"
                  value={area}
                  onChange={(event) => setArea(event.target.value)}
                />
              </Field>
              <Field label="Age (years)" htmlFor="val-age">
                <TextInput
                  id="val-age"
                  type="number"
                  min="0"
                  step="1"
                  value={age}
                  onChange={(event) => setAge(event.target.value)}
                />
              </Field>
              <Field label="Condition" htmlFor="val-condition">
                <Select
                  id="val-condition"
                  value={condition}
                  onChange={(event) => setCondition(event.target.value as Condition)}
                >
                  {conditions.map((item) => (
                    <option value={item} key={item}>
                      {titleCase(item)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Bedrooms" htmlFor="val-bedrooms">
                <TextInput
                  id="val-bedrooms"
                  type="number"
                  min="0"
                  value={bedrooms}
                  onChange={(event) => setBedrooms(event.target.value)}
                />
              </Field>
              <Field label="Bathrooms" htmlFor="val-bathrooms">
                <TextInput
                  id="val-bathrooms"
                  type="number"
                  min="0"
                  value={bathrooms}
                  onChange={(event) => setBathrooms(event.target.value)}
                />
              </Field>
              <Field
                label="Amenities"
                htmlFor="val-amenities"
                hint="Comma-separated: gym, pool, parking..."
                className="span-2"
              >
                <TextInput
                  id="val-amenities"
                  value={amenities}
                  onChange={(event) => setAmenities(event.target.value)}
                />
              </Field>
              <Field label="Notes" htmlFor="val-notes" className="span-2">
                <TextArea
                  id="val-notes"
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="View, renovation history, tenancy, plot ratio..."
                />
              </Field>
            </div>
            {formError ? <Alert tone="danger">{formError}</Alert> : null}
            <Button type="submit" loading={loading} icon={<Building2 size={16} />} full>
              Estimate value
            </Button>
          </form>
        </Card>

        <div className="result-column">
          {error ? (
            <Alert tone="danger" title="Valuation failed">
              {error}
            </Alert>
          ) : null}
          {loading ? (
            <Card>
              <LoadingResult label="Pricing the property" />
            </Card>
          ) : data ? (
            <ValuationResult data={data} />
          ) : (
            <Card>
              <EmptyState
                icon={<Building2 size={26} />}
                title="No valuation yet"
                description="Complete the property profile to generate a value range and factor breakdown."
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function OutlookBadge({ outlook }: { outlook: ValuationResponse["market_outlook"] }) {
  const Icon =
    outlook === "appreciating" ? TrendingUp : outlook === "declining" ? TrendingDown : Minus;
  const tone = outlook === "appreciating" ? "green" : outlook === "declining" ? "red" : "slate";
  return (
    <Badge tone={tone} dot>
      <Icon size={12} /> {titleCase(outlook)}
    </Badge>
  );
}

function ValuationResult({ data }: { data: ValuationResponse }) {
  return (
    <div className="result-stack">
      <Card
        title="Estimated market value"
        subtitle="A range, not a single-point promise."
        actions={<OutlookBadge outlook={data.market_outlook} />}
      >
        <div className="valuation-hero">
          <div>
            <span className="label">Indicative value range</span>
            <strong className="big-money">{formatMoneyRange(data.estimated_value)}</strong>
            <span className="muted">
              {formatMoneyRange(data.price_per_sqm)} per m²
            </span>
          </div>
          <div className="outlook-mark">
            <LineChart size={26} />
            <span>{titleCase(data.market_outlook)} 6–12 month outlook</span>
          </div>
        </div>
        <ConfidenceBar confidence={data.confidence} />
      </Card>

      <Card title="Value drivers" subtitle="Signed weights explain the adjustment stack.">
        <div className="factor-list">
          {data.valuation_factors.map((factor) => (
            <div className="factor" key={factor.name}>
              <div className="factor-head">
                <div>
                  <strong>{factor.name}</strong>
                  <span className="muted small">{factor.explanation}</span>
                </div>
                <div className="factor-side">
                  <Badge
                    tone={
                      factor.impact === "positive"
                        ? "green"
                        : factor.impact === "negative"
                          ? "red"
                          : "slate"
                    }
                  >
                    {titleCase(factor.impact)} · {Math.round(factor.weight * 100)}%
                  </Badge>
                </div>
              </div>
              <div className="progress subtle">
                <span style={{ width: `${factor.weight * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="split-results">
        <Card title="Comparable context" subtitle="How to sanity-check the range.">
          <p className="body-copy">{data.comparable_note}</p>
        </Card>
        <Card title="Assumptions" subtitle="What this estimate does not cover.">
          <BulletList items={data.assumptions} />
        </Card>
      </div>

      <Card title="Next steps" subtitle="Recommended diligence before relying on the number.">
        <BulletList items={data.recommendations} />
      </Card>

      <div className="result-stats">
        <Stat label="Market outlook" value={titleCase(data.market_outlook)} tone="blue" />
        <Stat
          label="Price confidence"
          value={`${Math.round(data.confidence.score * 100)}%`}
          hint="Model self-assessment"
        />
        <Stat
          label="Range width"
          value={formatNumber(
            ((data.estimated_value.max - data.estimated_value.min) /
              ((data.estimated_value.max + data.estimated_value.min) / 2)) *
              100,
            1,
          ).concat("%")}
          hint="Spread around midpoint"
        />
      </div>

      <Card title="Response metadata" subtitle="Contract provenance and quality signals.">
        <MetaBar meta={data.meta} />
        <JsonViewer data={data} />
      </Card>
    </div>
  );
}
