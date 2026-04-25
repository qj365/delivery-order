export function generateIncreasingId(
  prefix: string,
  latestId?: string,
  length = 6,
) {
  if (!latestId) {
    return `${prefix}${"1".padStart(length, "0")}`;
  }

  const number = Number(latestId.slice(prefix.length));
  const newNumber = number + 1;
  const newNumberString = newNumber.toString().padStart(length, "0");
  return `${prefix}${newNumberString}`;
}

export function joinValidString(
  arrStr: Array<string | null | undefined>,
  separator: string,
) {
  return arrStr.filter((str) => !!str).join(separator);
}

export function generateCodeById(prefix: string, id?: number, length = 6) {
  if (!id) {
    return `${prefix}${"1".padStart(length, "0")}`;
  }

  return `${prefix}${id.toString().padStart(length, "0")}`;
}

export function isValidHttpUrl(urlString: string) {
  let url: URL;

  try {
    url = new URL(urlString);
  } catch (_) {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
}

export function removeQueryString(url: string) {
  return new URL(decodeURIComponent(url.trim().toLowerCase()))
    .toString()
    .split("?")[0];
}

export function maskEmail(email: string): string {
  return email.replace(/^(.).*?(@.+)$/, "$1*****$2");
}

export function processAddress(
  address1: string | null,
  address2: string | null,
  city: string | null,
): string {
  let address = "";
  if (address1) {
    address += `${address1}, `;
  }
  if (address2) {
    address += `${address2}, `;
  }
  if (city) {
    address += `${city}, `;
  }
  if (address) {
    address = address.replace(/,\s$/, "");
  }

  return address;
}

export function uppercaseFirstLetter(str: string) {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}
