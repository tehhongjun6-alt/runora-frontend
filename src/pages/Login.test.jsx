import { test, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Login from './Login'

test('shows a message when login details are empty', () => {
    // Show the login form without entering any details
    render(<Login onLogin={() => { }} />)

    // Click Log in and check the validation message
    fireEvent.click(screen.getByText('Log in'))

    expect(
        screen.getByText('Enter your email and password')
    ).toBeTruthy()
})