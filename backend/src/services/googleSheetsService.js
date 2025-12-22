import { google } from 'googleapis'

// Spreadsheet ID z URL
const SPREADSHEET_ID = '1yrtA3OPpiJBaH-oo1zQPx1qDQ9k04ccpiWnmKh8NF3o'

// Nazwy arkuszy (zakładek)
const SHEETS = {
  CARRIERS: 'Przewoźnicy',
  USERS: 'Użytkownicy'
}

// Autoryzacja z Service Account
const getPrivateKey = () => {
  const key = process.env.GOOGLE_PRIVATE_KEY
  if (!key) return ''
  
  // Jeśli klucz jest w Base64, zdekoduj go
  if (!key.includes('BEGIN PRIVATE KEY')) {
    try {
      return Buffer.from(key, 'base64').toString('utf-8')
    } catch (e) {
      console.error('❌ Błąd dekodowania Base64:', e)
    }
  }
  
  // Jeśli klucz ma literalne \n (jako tekst), zamień na prawdziwe nowe linie
  if (key.includes('\\n')) {
    return key.replace(/\\n/g, '\n')
  }
  
  // Jeśli już ma prawdziwe nowe linie, użyj jak jest
  return key
}

const auth = new google.auth.GoogleAuth({
  credentials: {
    type: 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key: getPrivateKey(),
    client_email: process.env.GOOGLE_CLIENT_EMAIL
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
})

const sheets = google.sheets({ version: 'v4', auth })

// =======================
// PRZEWOŹNICY
// =======================

export const syncCarrierToSheets = async (carrierData) => {
  try {
    const row = [
      carrierData.companyName,
      carrierData.companyRegistration,
      carrierData.country,
      carrierData.email || '',
      carrierData.phone || '',
      carrierData.description || '',
      carrierData.isPremium ? 'Tak' : 'Nie',
      carrierData.createdAt ? new Date(carrierData.createdAt).toLocaleDateString('pl-PL') : '',
      carrierData._id.toString(),
      carrierData.userId.toString(),
      carrierData.isVerified ? 'Tak' : 'Nie',
      carrierData.isActive ? 'Tak' : 'Nie',
      carrierData.website || '',
      carrierData.services ? carrierData.services.join(', ') : '',
      carrierData.operatingCountries ? carrierData.operatingCountries.join(', ') : ''
    ]

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.CARRIERS}!A:O`,
      valueInputOption: 'RAW',
      resource: {
        values: [row]
      }
    })

    console.log('✅ Przewoźnik dodany do Google Sheets:', carrierData.companyName)
  } catch (error) {
    console.error('❌ Błąd synchronizacji przewoźnika do Google Sheets:', error.message)
    throw error
  }
}

export const updateCarrierInSheets = async (mongoId, updates) => {
  try {
    // Znajdź wiersz po MongoDB ID (kolumna I - 9)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.CARRIERS}!A:O`
    })

    const rows = response.data.values || []
    const rowIndex = rows.findIndex(row => row[8] === mongoId) // kolumna I (index 8)

    if (rowIndex === -1) {
      console.log('⚠️ Przewoźnik nie znaleziony w Google Sheets')
      return
    }

    // Aktualizuj odpowiednie komórki
    const currentRow = rows[rowIndex]
    const updatedRow = [...currentRow]

    if (updates.companyName) updatedRow[0] = updates.companyName
    if (updates.email) updatedRow[3] = updates.email
    if (updates.phone) updatedRow[4] = updates.phone
    if (updates.description) updatedRow[5] = updates.description
    if (updates.isPremium !== undefined) updatedRow[6] = updates.isPremium ? 'Tak' : 'Nie'
    if (updates.isVerified !== undefined) updatedRow[10] = updates.isVerified ? 'Tak' : 'Nie'
    if (updates.isActive !== undefined) updatedRow[11] = updates.isActive ? 'Tak' : 'Nie'
    if (updates.website) updatedRow[12] = updates.website
    if (updates.services) updatedRow[13] = updates.services.join(', ')
    if (updates.operatingCountries) updatedRow[14] = updates.operatingCountries.join(', ')

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.CARRIERS}!A${rowIndex + 1}:O${rowIndex + 1}`,
      valueInputOption: 'RAW',
      resource: {
        values: [updatedRow]
      }
    })

    console.log('✅ Przewoźnik zaktualizowany w Google Sheets')
  } catch (error) {
    console.error('❌ Błąd aktualizacji przewoźnika w Google Sheets:', error.message)
  }
}

// =======================
// UŻYTKOWNICY
// =======================

export const syncUserToSheets = async (userData) => {
  try {
    const row = [
      userData.firstName,
      userData.lastName,
      userData.email,
      userData.phone || '',
      userData.userType === 'carrier' ? 'Przewoźnik' : 'Klient',
      userData.isPremium ? 'Tak' : 'Nie',
      userData.isAdmin ? 'Tak' : 'Nie',
      userData.isActive ? 'Tak' : 'Nie',
      userData.createdAt ? new Date(userData.createdAt).toLocaleDateString('pl-PL') : '',
      userData._id.toString(),
      userData.marketingConsent ? 'Tak' : 'Nie',
      userData.carrierProfile?.companyName || ''
    ]

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.USERS}!A:L`,
      valueInputOption: 'RAW',
      resource: {
        values: [row]
      }
    })

    console.log('✅ Użytkownik dodany do Google Sheets:', userData.email)
  } catch (error) {
    console.error('❌ Błąd synchronizacji użytkownika do Google Sheets:', error.message)
    throw error
  }
}

export const updateUserInSheets = async (mongoId, updates) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.USERS}!A:L`
    })

    const rows = response.data.values || []
    const rowIndex = rows.findIndex(row => row[9] === mongoId) // kolumna J (index 9)

    if (rowIndex === -1) {
      console.log('⚠️ Użytkownik nie znaleziony w Google Sheets')
      return
    }

    const currentRow = rows[rowIndex]
    const updatedRow = [...currentRow]

    if (updates.firstName) updatedRow[0] = updates.firstName
    if (updates.lastName) updatedRow[1] = updates.lastName
    if (updates.email) updatedRow[2] = updates.email
    if (updates.phone) updatedRow[3] = updates.phone
    if (updates.isPremium !== undefined) updatedRow[5] = updates.isPremium ? 'Tak' : 'Nie'
    if (updates.isActive !== undefined) updatedRow[7] = updates.isActive ? 'Tak' : 'Nie'
    if (updates.marketingConsent !== undefined) updatedRow[10] = updates.marketingConsent ? 'Tak' : 'Nie'

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.USERS}!A${rowIndex + 1}:L${rowIndex + 1}`,
      valueInputOption: 'RAW',
      resource: {
        values: [updatedRow]
      }
    })

    console.log('✅ Użytkownik zaktualizowany w Google Sheets')
  } catch (error) {
    console.error('❌ Błąd aktualizacji użytkownika w Google Sheets:', error.message)
  }
}

// =======================
// SYNCHRONIZACJA MASOWA
// =======================

export const syncAllCarriersToSheets = async (carriers) => {
  const results = { success: 0, failed: 0, errors: [] }
  
  for (const carrier of carriers) {
    try {
      await syncCarrierToSheets(carrier)
      results.success++
    } catch (error) {
      results.failed++
      results.errors.push({ carrier: carrier.companyName, error: error.message })
    }
  }
  
  return results
}

export const syncAllUsersToSheets = async (users) => {
  const results = { success: 0, failed: 0, errors: [] }
  
  for (const user of users) {
    try {
      await syncUserToSheets(user)
      results.success++
    } catch (error) {
      results.failed++
      results.errors.push({ user: user.email, error: error.message })
    }
  }
  
  return results
}
