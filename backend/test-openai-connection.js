import dotenv from 'dotenv'
import OpenAI from 'openai'

dotenv.config()

const apiKey = process.env.OPENAI_API_KEY

console.log('Testing OpenAI connection...')
console.log('API Key present:', apiKey ? `Yes (${apiKey.substring(0, 10)}...)` : 'NO!')

if (!apiKey) {
  console.error('❌ OPENAI_API_KEY not found in .env')
  process.exit(1)
}

const openai = new OpenAI({ apiKey })

async function test() {
  try {
    console.log('\n🚀 Sending test message to OpenAI...')
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: 'Odpowiedz jednym słowem: działa?' }
      ],
      max_tokens: 10,
    })

    const reply = completion.choices[0].message.content
    console.log('\n✅ SUCCESS! OpenAI responded:', reply)
    console.log('\nFull response:', JSON.stringify(completion, null, 2))
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message)
    if (error.status) console.error('Status:', error.status)
    if (error.code) console.error('Code:', error.code)
    process.exit(1)
  }
}

test()
