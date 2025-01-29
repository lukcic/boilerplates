def parse_link_header(link_header):
    """Parses a Link header string into a dictionary of URLs with relations.

    :param link_header: The Link header string to parse.
    :return: A dictionary where keys are relation types and values are corresponding URLs.
    """

    links = {}
    parts = link_header.split(", ")
    for part in parts:
        url_part, rel_part = part.split("; ")
        url = url_part.strip("<>")
        rel = rel_part.split("=")[1].strip("\"")
        links[rel] = url
    return links