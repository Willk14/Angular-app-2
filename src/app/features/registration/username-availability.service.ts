import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

interface JsonPlaceholderUser {
  username?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UsernameAvailabilityService {
  private readonly apiUrl = 'https://jsonplaceholder.typicode.com/users';

  constructor(private readonly http: HttpClient) {}

  checkUsername(username: string): Observable<boolean> {
    return this.http.get<JsonPlaceholderUser[]>(this.apiUrl).pipe(
      map((users) => {
        const normalizedUsername = username.trim().toLowerCase();
        return !users.some((user) => user.username?.toLowerCase() === normalizedUsername);
      })
    );
  }
}
