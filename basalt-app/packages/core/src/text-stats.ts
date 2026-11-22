export function countWords(text: string): number {
    const word = /[\p{L}\p{N}]\S*/gu;
    let count = 0;
    while (word.test(text)) count += 1;
    return count;
}
