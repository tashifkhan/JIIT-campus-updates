import {
	createSerializer,
	parseAsString,
	parseAsStringLiteral,
} from "nuqs/server";

export const statsQueryParams = {
	q: parseAsString
		.withDefault("")
		.withOptions({ history: "replace", shallow: true, clearOnDefault: true }),
};

export const serializeStatsQuery = createSerializer(statsQueryParams, {
	clearOnDefault: true,
});

export const jobYearValues = ["202526", "202627"] as const;

export const jobDetailQueryParams = {
	year: parseAsStringLiteral(jobYearValues),
};

export const serializeJobDetailQuery = createSerializer(jobDetailQueryParams);

export const secretAccessQueryParser = parseAsString.withOptions({
	history: "replace",
	shallow: true,
});
