
import { transposeDetails } from './src/utils/parseChords';

const TORTURE_TEST_A = `
I [Am]feel like I am [F]floating
When [C]night comes [G]down
`;

const TORTURE_TEST_B = `
G        D/F#     Em7      Cadd9
When I find myself in times of trouble
G        D        C        G
Mother Mary comes to me
`;

console.log("--- TEST A (+2 Sharp) ---");
console.log(transposeDetails(TORTURE_TEST_A, 2, true));

console.log("\n--- TEST B (-2 Flat) ---");
console.log(transposeDetails(TORTURE_TEST_B, -2, false));
