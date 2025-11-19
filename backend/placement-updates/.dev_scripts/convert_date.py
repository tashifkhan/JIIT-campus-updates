from datetime import datetime
import pytz  # You might need to install this: pip install pytz


def convert_ist_to_iso_utc(input_str: str, year: int = 2025) -> str:
    """
    Converts a date string like 'Tue 18 Mar, 14:44 ist' to ISO 8601 UTC format.

    Args:
        input_str: The input date/time string (e.g., 'Tue 18 Mar, 14:44 ist').
        year: The assumed year for the input string, as it's often omitted.

    Returns:
        A string in ISO 8601 format (YYYY-MM-DDTHH:MM:SS.000+00:00).
    """
    # --- Assumptions (as discussed) ---
    # 1. Year is {year}.
    # 2. Seconds and Milliseconds are defaulted to 00 and 000 respectively.

    # Extract date and time parts from the input string
    # E.g., "Tue 18 Mar" and "14:44"
    parts = input_str.replace(" ist", "").strip().split(",")
    date_part = parts[0].strip()
    time_part = parts[1].strip()

    # Construct a full date-time string including the assumed year
    full_date_time_str = f"{date_part} {year} {time_part}"

    # Define the format for parsing the input
    # %d: Day of the month (e.g., 18)
    # %b: Abbreviated month name (e.g., Mar)
    # %Y: Year (e.g., 2025)
    # %H: Hour (24-hour clock) (e.g., 14)
    # %M: Minute (e.g., 44)
    parse_format = "%d %b %Y %H:%M"

    try:
        # Parse the string into a naive datetime object
        dt_naive = datetime.strptime(full_date_time_str, parse_format)

        # Define the IST timezone (Asia/Kolkata is the IANA standard for IST)
        ist_tz = pytz.timezone("Asia/Kolkata")

        # Localize the naive datetime object to IST
        dt_ist = ist_tz.localize(dt_naive)

        # Convert the localized datetime object to UTC
        dt_utc = dt_ist.astimezone(pytz.utc)

        # Format the UTC datetime object to the desired ISO 8601 string
        # We explicitly add '.000+00:00' for consistency with your request
        # since seconds and milliseconds were not in the original input.
        formatted_utc = dt_utc.strftime("%Y-%m-%dT%H:%M:%S.000+00:00")

        return formatted_utc

    except ValueError as e:
        return f"Error: Could not parse date/time. Please check the input format. {e}"
    except pytz.exceptions.UnknownTimeZoneError:
        return "Error: Unknown timezone 'Asia/Kolkata'. Ensure pytz and timezone data are correctly set up."
    except Exception as e:
        return f"An unexpected error occurred: {e}"


# Example usage:
input_date = "20 Jul, 19:48 ist"
converted_date = convert_ist_to_iso_utc(input_date, year=2025)
print(f"Original: '{input_date}' (assuming 2025)")
print(f"Converted: '{converted_date}'")

# If you needed a different year, you could pass it like this:
# converted_date_2024 = convert_ist_to_iso_utc("Tue 18 Mar, 14:44 ist", year=2024)
# print(f"Converted (2024): '{converted_date_2024}'")
