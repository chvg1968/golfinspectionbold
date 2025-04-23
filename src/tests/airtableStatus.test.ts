import { sendToAirtable } from '../components/AirtableService';

// Mock global fetch
const fetchMock = jest.fn();
// @ts-ignore
global.fetch = fetchMock as any;

describe('Airtable Status integration', () => {
  beforeEach(() => {
    fetchMock.mockClear();
  });

  it('should send status as Pending when form is sent without signature', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'rec123', fields: { Status: 'Pending' } })
    });
    const formData = {
      guestName: 'Test User',
      inspectionDate: '2025-04-22',
      property: 'Test Property',
      status: 'Pending',
    };
    const pdfLink = 'https://test.pdf';
    const result = await sendToAirtable(formData, pdfLink);
    expect(fetchMock).toHaveBeenCalled();
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.fields.Status).toBe('Pending');
    expect(result.fields.Status).toBe('Pending');
  });

  it('should send status as Signed when form is signed and sent', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'rec456', fields: { Status: 'Signed' } })
    });
    const formData = {
      guestName: 'Test User',
      inspectionDate: '2025-04-22',
      property: 'Test Property',
      status: 'Signed',
    };
    const pdfLink = 'https://test.pdf';
    const result = await sendToAirtable(formData, pdfLink);
    expect(fetchMock).toHaveBeenCalled();
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.fields.Status).toBe('Signed');
    expect(result.fields.Status).toBe('Signed');
  });
});
