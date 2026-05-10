// Pure-logic unit tests for UInventory.
// These mirror the validation and translation rules used inside the API routes.

const CONDITION_LABEL = { '1': 'Damaged', '2': 'Fair', '3': 'New' };
const CONDITION_CODE = { Damaged: '1', Fair: '2', New: '3' };

function isUmassEmail(email) {
    return typeof email === 'string' && email.trim().toLowerCase().endsWith('@umass.edu');
}

function availabilityToBool(label) {
    return label === 'Available';
}

function availabilityFromBool(value) {
    return value ? 'Available' : 'Checked Out';
}

describe('UMass email validation', () => {
    test('accepts a valid @umass.edu address', () => {
        expect(isUmassEmail('student@umass.edu')).toBe(true);
    });

    test('accepts uppercase @UMASS.EDU', () => {
        expect(isUmassEmail('Student@UMASS.EDU')).toBe(true);
    });

    test('accepts whitespace-padded address', () => {
        expect(isUmassEmail('   student@umass.edu   ')).toBe(true);
    });

    test('rejects non-umass domains', () => {
        expect(isUmassEmail('student@gmail.com')).toBe(false);
        expect(isUmassEmail('student@cs.umass.edu.com')).toBe(false);
    });

    test('rejects empty / non-string input', () => {
        expect(isUmassEmail('')).toBe(false);
        expect(isUmassEmail(null)).toBe(false);
        expect(isUmassEmail(undefined)).toBe(false);
    });
});

describe('Item condition label/code translation', () => {
    test('translates DB code -> human label', () => {
        expect(CONDITION_LABEL['1']).toBe('Damaged');
        expect(CONDITION_LABEL['2']).toBe('Fair');
        expect(CONDITION_LABEL['3']).toBe('New');
    });

    test('translates human label -> DB code', () => {
        expect(CONDITION_CODE['Damaged']).toBe('1');
        expect(CONDITION_CODE['Fair']).toBe('2');
        expect(CONDITION_CODE['New']).toBe('3');
    });

    test('round-trips label -> code -> label', () => {
        for (const label of ['New', 'Fair', 'Damaged']) {
            expect(CONDITION_LABEL[CONDITION_CODE[label]]).toBe(label);
        }
    });
});

describe('Item availability translation', () => {
    test('"Available" maps to true', () => {
        expect(availabilityToBool('Available')).toBe(true);
    });

    test('"Checked Out" maps to false', () => {
        expect(availabilityToBool('Checked Out')).toBe(false);
    });

    test('boolean true maps back to "Available"', () => {
        expect(availabilityFromBool(true)).toBe('Available');
    });

    test('boolean false maps back to "Checked Out"', () => {
        expect(availabilityFromBool(false)).toBe('Checked Out');
    });
});
