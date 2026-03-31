import axios from 'axios';

const token = '8611142801:AAEgzA-sF6K6_0P_uWqD5l-G0_p1H8-wI0E';

async function testSync() {
  const commands = [
    { command: 'start', description: 'Botni boshlash', type: 'text', response: '' },
    { command: 'sklad', description: 'Omborxonalar ro\'yxati (Qidiruv)', type: 'action', response: 'sklad' }
  ];

  console.log('Testing setMyCommands with extra fields...');
  try {
    const r = await axios.post(`https://api.telegram.org/bot${token}/setMyCommands`, { commands });
    console.log('Result:', r.data);
  } catch (e: any) {
    console.error('Error:', e.response?.data || e.message);
  }
}

testSync();
