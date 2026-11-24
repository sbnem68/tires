"""Location directory seed (Addendum A).

Planning prospect counts are SUPPLIED PLANNING DATA for the whole group - not verified
business listings, not partner counts, and never split per city.

To add a market or city later: add it here (or through the admin screen in a later
checkpoint) and run `python seed.py`. No application code changes are needed.
"""

COUNT_SOURCE = "Supplied by Sam in the build brief (planning figure, unverified)"
TIMEZONE = "America/Toronto"  # every seeded city observes Eastern Time

PROVINCES = [
    {
        "code": "ON", "name": "Ontario", "default_locale": "en-CA", "supported_locales": ["en-CA"],
        "tax_components": [{"name": "HST", "rate": "0.13"}],
        "disclosure_notes": "Tax and disclosure settings pending Sam's verification.",
    },
    {
        "code": "QC", "name": "Quebec", "default_locale": "fr-CA", "supported_locales": ["fr-CA", "en-CA"],
        "tax_components": [{"name": "GST", "rate": "0.05"}, {"name": "QST", "rate": "0.09975"}],
        "disclosure_notes": (
            "Separate province configuration. French and English content, tax/disclosure settings, "
            "and privacy/consent wording must be reviewed and approved by Sam before any Quebec launch."
        ),
    },
]

# (priority, tier, group name, group slug, planning count, province, [cities])
MARKET_GROUPS = [
    (1, 1, "Ottawa", "ottawa", 21, "ON", ["Ottawa"]),
    (2, 1, "Gatineau", "gatineau", 4, "QC", ["Gatineau"]),
    (3, 2, "Burlington corridor", "burlington-corridor", 47, "ON", ["Burlington", "Hamilton", "Oakville", "Milton"]),
    (4, 2, "Toronto", "toronto", 57, "ON", ["Toronto"]),
    (5, 2, "Mississauga\u2013Brampton", "mississauga-brampton", 30, "ON", ["Mississauga", "Brampton"]),
    (6, 2, "York Region", "york-region", 34, "ON", ["Vaughan", "Markham", "Richmond Hill"]),
    (7, 3, "Waterloo\u2013Wellington", "waterloo-wellington", 42, "ON", ["Kitchener", "Waterloo", "Cambridge", "Guelph"]),
    (8, 3, "London", "london", 13, "ON", ["London"]),
    (9, 3, "Niagara", "niagara", 25, "ON", ["St. Catharines", "Niagara Falls", "Welland"]),
    (10, 3, "Windsor", "windsor", 16, "ON", ["Windsor"]),
    (11, 4, "Barrie\u2013Peterborough planning group", "barrie-peterborough", 18, "ON", ["Barrie", "Peterborough"]),
    (12, 4, "Kingston", "kingston", 4, "ON", ["Kingston"]),
    (13, 4, "Durham", "durham", 32, "ON", ["Oshawa", "Whitby", "Pickering"]),
    (14, 4, "Sudbury", "sudbury", 5, "ON", ["Sudbury"]),
]

GROUP_NOTES = {
    "gatineau": "Planning pool (4) is below the 5-active-partner expansion gate. Needs Sam's decision.",
    "kingston": "Planning pool (4) is below the 5-active-partner expansion gate. Needs Sam's decision.",
    "barrie-peterborough": "Planning group only. Barrie and Peterborough are not adjacent markets.",
}

# city slug -> [subarea names]
SUBAREAS = {"toronto": ["North York", "Scarborough", "Etobicoke"]}


def slugify(name: str) -> str:
    return name.lower().replace(".", "").replace(" ", "-")
