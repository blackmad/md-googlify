import * as fs from 'fs';

import * as DDG from 'duck-duck-scrape';
import he from 'he';

export async function getTopSearchResultFromDDG(params: {
  name: string;
  searchQuerySuffix: string;
}) {
  const { name, searchQuerySuffix } = params;
  const query = `${name} ${searchQuerySuffix}`;
  console.log(`Searching for ${query}`);
  const searchResults = await DDG.search(query, {
    safeSearch: DDG.SafeSearchType.STRICT,
  });

  const topResult = searchResults.results[0];

  if (!topResult) {
    return;
  }

  return topResult;

  // if (resultTitle.toLocaleLowerCase().includes(name.toLocaleLowerCase())) {
  //   return topResult.url;
  // }
}

const inputFilename = process.argv[2].replace('~', process.env.HOME ?? '');
console.log(inputFilename);
let contents = fs.readFileSync(inputFilename, 'utf8');

// Find if there's an html comment with googlify in it
const googlifyComment = contents.match(/<!-- google (.*) -->/g);
console.log({ googlifyComment });
// Get the google extra from the comment if present
const googlifyExtra = googlifyComment?.[0].match(/google (.*) -->/)?.[1];

// extract all links of the form [[link]]
const links = contents.match(/\[\[(.*?)\]\]/g);
for (const link of links ?? []) {
  console.log(link);
  let linkTitle = link.match(/\[\[(.*?)\]\]/)?.[1];

  console.log({ linkTitle });
  if (!linkTitle) {
    console.error('no link title for: ' + link);
    continue;
  }

  const shouldReplace = true;
  // const shouldReplace = linkTitle.includes(':replace');
  // linkTitle = linkTitle.replace(':replace', '');

  const topResult = await getTopSearchResultFromDDG({
    name: linkTitle,
    searchQuerySuffix: googlifyExtra ?? '',
  });

  if (!topResult) {
    console.error('no url for: ' + link);
    continue;
  }

  const { url, title } = topResult;

  const resultTitle = he.decode(title);

  console.log(`Got url for ${linkTitle}: ${url}, replacing? ${shouldReplace}`);

  contents = contents.replace(
    link,
    `[${shouldReplace ? resultTitle : linkTitle}](${url})`,
  );
}

fs.writeFileSync(inputFilename, contents, 'utf8');
