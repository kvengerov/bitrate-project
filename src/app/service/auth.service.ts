import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFirestore, AngularFirestoreDocument } from 'angularfire2/firestore';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import 'rxjs/add/operator/switchMap';
import { Md5 } from 'ts-md5/dist/md5';
import {ChatService} from './chat.service';


interface User {
  uid: string;
  email: string;
  photoURL?: string;
  displayName?: string;
}

@Injectable()
export class AuthService {
  public user: Observable<User>;
  private userDetails: any;
  public authState: any = null;

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private router: Router,
  ) {
    this.user = this.afAuth.authState.switchMap(user => {
      if (user) {
        return this.afs.doc<User>(`users/${user.uid}`).valueChanges();
      } else {
        return Observable.of(null);
      }
    });
    this.afAuth.authState.subscribe((auth) =>  this.authState = auth);
  }
  googleLogin(): Observable<any> {
    const provider = new firebase.auth.GoogleAuthProvider()
    return Observable.fromPromise(
      this.socialLogin(provider)
    );
  }
  facebookLogin(): Observable<any> {
    const provider = new firebase.auth.FacebookAuthProvider()
    return Observable.fromPromise(
      this.socialLogin(provider)
    );
  }
  twitterLogin(): Observable<any> {
    const provider = new firebase.auth.TwitterAuthProvider()
    return Observable.fromPromise(
      this.socialLogin(provider)
    );
  }
  private socialLogin(provider) {
    return this.afAuth.auth.signInWithPopup(provider)
      .then(credential => {
        return this.updateUserData(credential.user);
      })
      .catch(error => console.log(error.message));
  }
  login(email, password): Observable<any> {
    return Observable.fromPromise(
      this.afAuth.auth.signInWithEmailAndPassword(email, password)
        .then(() => console.log(`You have succesfully logged in`))
        .catch(error => console.log(error.message))
    );
  }
  register(email, password): Observable<any> {
    return Observable.fromPromise(
      this.afAuth.auth.createUserWithEmailAndPassword(email, password)
        .then(user => this.updateUserData(user))
        .then(() => console.log(`Your account has been created`))
        .then(user => {this.afAuth.auth.currentUser.sendEmailVerification()
          .then(() => console.log(`We sent you an email verification`))
          .catch(error => console.log(error.message));
        })
        .catch(error => console.log(error.message))
    );
  }
  resetPassword(email): Observable<any> {
    return Observable.fromPromise(
      firebase.auth().sendPasswordResetEmail(email)
        .then(() => console.log(`We sent you a reset password verification`))
        .catch(error => console.log(error.message))
    );
  }
  private updateUserData(user) {
    const userRef: AngularFirestoreDocument<User> = this.afs.doc(`users/${user.uid}`);
    const data: User = {
      uid: user.uid,
      email: user.email || null,
      displayName: user.displayName,
      photoURL: user.photoURL || `http://www.gravatar.com/avatar/` + Md5.hashStr(user.uid) + `?d=identicon`,
    };
    return userRef.set(data, {merge: true});
  }
  isAuthentificates(): Observable<boolean> {
    return this.user.map(user => user && user.uid !== undefined);
  }
  logout() {
    return this.afAuth.auth.signOut()
      .then(() => {
        this.router.navigate([`/`]);
      });
  }
  getUser() {
    return {
      name: this.userDetails.displayName,
      email: this.userDetails.email,
      uid: this.userDetails.uid
    };
  }
  get authenticated(): boolean {
    return this.authState !== null;
  }
  get currentUserId(): string {
    return this.authenticated ? this.authState.uid : null;
  }
}
