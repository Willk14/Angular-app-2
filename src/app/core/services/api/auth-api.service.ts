import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LoginModel, UserModel } from '../../models';

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly apiUrl = 'http://localhost:3001/api/v1';

  constructor(private readonly http: HttpClient) {}

  login(credentials: LoginModel): Observable<{ accessToken: string; user: UserModel }> {
    return this.http.post<{ accessToken: string; user: UserModel }>(`${this.apiUrl}/auth/login`, credentials);
  }

  register(user: UserModel): Observable<UserModel> {
    return this.http.post<UserModel>(`${this.apiUrl}/users`, user);
  }
}
