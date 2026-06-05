export const getErrorMessage = (error) => {
  if (!error) return 'An unknown error occurred'
  if (error.response?.data?.message) return error.response.data.message
  if (error.response?.data?.details) return error.response.data.details
  if (error.message) return error.message
  if (typeof error === 'string') return error
  return 'An unknown error occurred'
}
