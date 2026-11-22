const WORD_CHARACTER = /[\p{L}\p{N}]/u;
const WHITESPACE = /\s+/;

export function countWords(text: string): number {
    let count = 0;
    for (const token of text.split(WHITESPACE)) {
        if (WORD_CHARACTER.test(token)) count += 1;
    }
    return count;
}
