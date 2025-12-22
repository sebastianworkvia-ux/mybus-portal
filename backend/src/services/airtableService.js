import Airtable from 'airtable'

// Konfiguracja Airtable
const base = new Airtable({
  apiKey: process.env.AIRTABLE_TOKEN
}).base(process.env.AIRTABLE_BASE_ID)

// Tabele
const TABLES = {
  CARRIERS: 'Przewoźnicy',
  USERS: 'Użytkownicy'
}

// =======================
// PRZEWOŹNICY
// =======================

export const syncCarrierToAirtable = async (carrierData) => {
  try {
    const record = await base(TABLES.CARRIERS).create([
      {
        fields: {
          'Nazwa przewoźnika': carrierData.companyName,
          'NIP/Rejestracja': carrierData.companyRegistration,
          'Kraj': carrierData.country,
          'Email': carrierData.email || '',
          'Telefon': carrierData.phone || '',
          'Opis': carrierData.description || '',
          'Premium': carrierData.isPremium ? 'Tak' : 'Nie',
          'Plan': carrierData.subscriptionPlan || 'free',
          'Data rejestracji': new Date(carrierData.createdAt).toISOString(),
          'MongoDB ID': carrierData._id.toString(),
          'User ID': carrierData.userId.toString(),
          'Zweryfikowany': carrierData.isVerified ? 'Tak' : 'Nie',
          'Aktywny': carrierData.isActive ? 'Tak' : 'Nie',
          'Website': carrierData.website || '',
          'Usługi': carrierData.services ? carrierData.services.join(', ') : '',
          'Kraje obsługi': carrierData.operatingCountries ? carrierData.operatingCountries.join(', ') : ''
        }
      }
    ])
    
    console.log('✅ Przewoźnik zsynchronizowany do Airtable:', carrierData.companyName)
    return record[0]
  } catch (error) {
    console.error('❌ Błąd synchronizacji przewoźnika do Airtable:', error.message)
    throw error
  }
}

export const updateCarrierInAirtable = async (mongoId, updates) => {
  try {
    // Znajdź rekord po MongoDB ID
    const records = await base(TABLES.CARRIERS)
      .select({
        filterByFormula: `{MongoDB ID} = '${mongoId}'`,
        maxRecords: 1
      })
      .firstPage()

    if (records.length === 0) {
      console.log('⚠️ Nie znaleziono przewoźnika w Airtable, tworzę nowy...')
      return await syncCarrierToAirtable(updates)
    }

    const recordId = records[0].id
    const fields = {}

    if (updates.companyName) fields['Nazwa przewoźnika'] = updates.companyName
    if (updates.email) fields['Email'] = updates.email
    if (updates.phone) fields['Telefon'] = updates.phone
    if (updates.description) fields['Opis'] = updates.description
    if (updates.isPremium !== undefined) fields['Premium'] = updates.isPremium ? 'Tak' : 'Nie'
    if (updates.subscriptionPlan) fields['Plan'] = updates.subscriptionPlan
    if (updates.isVerified !== undefined) fields['Zweryfikowany'] = updates.isVerified ? 'Tak' : 'Nie'
    if (updates.isActive !== undefined) fields['Aktywny'] = updates.isActive ? 'Tak' : 'Nie'
    if (updates.website) fields['Website'] = updates.website
    if (updates.services) fields['Usługi'] = updates.services.join(', ')
    if (updates.operatingCountries) fields['Kraje obsługi'] = updates.operatingCountries.join(', ')

    await base(TABLES.CARRIERS).update(recordId, fields)
    console.log('✅ Przewoźnik zaktualizowany w Airtable')
  } catch (error) {
    console.error('❌ Błąd aktualizacji przewoźnika w Airtable:', error.message)
  }
}

// =======================
// UŻYTKOWNICY
// =======================

export const syncUserToAirtable = async (userData) => {
  try {
    const record = await base(TABLES.USERS).create([
      {
        fields: {
          'Imię': userData.firstName,
          'Nazwisko': userData.lastName,
          'Email': userData.email,
          'Telefon': userData.phone || '',
          'Typ konta': userData.userType === 'carrier' ? 'Przewoźnik' : 'Klient',
          'Premium': userData.isPremium ? 'Tak' : 'Nie',
          'Admin': userData.isAdmin ? 'Tak' : 'Nie',
          'Aktywny': userData.isActive ? 'Tak' : 'Nie',
          'Data rejestracji': new Date(userData.createdAt).toISOString(),
          'MongoDB ID': userData._id.toString(),
          'Zgoda marketingowa': userData.marketingConsent ? 'Tak' : 'Nie',
          'Nazwa firmy': userData.carrierProfile?.companyName || ''
        }
      }
    ])
    
    console.log('✅ Użytkownik zsynchronizowany do Airtable:', userData.email)
    return record[0]
  } catch (error) {
    console.error('❌ Błąd synchronizacji użytkownika do Airtable:', error.message)
    throw error
  }
}

export const updateUserInAirtable = async (mongoId, updates) => {
  try {
    const records = await base(TABLES.USERS)
      .select({
        filterByFormula: `{MongoDB ID} = '${mongoId}'`,
        maxRecords: 1
      })
      .firstPage()

    if (records.length === 0) {
      console.log('⚠️ Nie znaleziono użytkownika w Airtable')
      return
    }

    const recordId = records[0].id
    const fields = {}

    if (updates.firstName) fields['Imię'] = updates.firstName
    if (updates.lastName) fields['Nazwisko'] = updates.lastName
    if (updates.email) fields['Email'] = updates.email
    if (updates.phone) fields['Telefon'] = updates.phone
    if (updates.isPremium !== undefined) fields['Premium'] = updates.isPremium ? 'Tak' : 'Nie'
    if (updates.isActive !== undefined) fields['Aktywny'] = updates.isActive ? 'Tak' : 'Nie'
    if (updates.marketingConsent !== undefined) fields['Zgoda marketingowa'] = updates.marketingConsent ? 'Tak' : 'Nie'

    await base(TABLES.USERS).update(recordId, fields)
    console.log('✅ Użytkownik zaktualizowany w Airtable')
  } catch (error) {
    console.error('❌ Błąd aktualizacji użytkownika w Airtable:', error.message)
  }
}

// =======================
// SYNCHRONIZACJA MASOWA
// =======================

export const syncAllCarriersToAirtable = async (carriers) => {
  const results = { success: 0, failed: 0, errors: [] }
  
  for (const carrier of carriers) {
    try {
      await syncCarrierToAirtable(carrier)
      results.success++
    } catch (error) {
      results.failed++
      results.errors.push({ carrier: carrier.companyName, error: error.message })
    }
  }
  
  return results
}

export const syncAllUsersToAirtable = async (users) => {
  const results = { success: 0, failed: 0, errors: [] }
  
  for (const user of users) {
    try {
      await syncUserToAirtable(user)
      results.success++
    } catch (error) {
      results.failed++
      results.errors.push({ user: user.email, error: error.message })
    }
  }
  
  return results
}
