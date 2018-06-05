import { Injectable } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFirestore, AngularFirestoreDocument } from 'angularfire2/firestore';
import * as firebase from 'firebase/app';
import { Observable } from 'rxjs/Observable';
import { Router } from '@angular/router';
import 'rxjs/add/operator/switchMap';

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
  constructor(private  afAuth: AngularFireAuth, private afs: AngularFirestore, private router: Router) {
    this.user = this.afAuth.authState.switchMap(user => {
      if (user) {
        return this.afs.doc<User>('user/${user.uid}').valueChanges();
      } else {
        return Observable.of(null);
      }
    });// ---------------CONTINUE--------------
    // this.user.subscribe(user => {
    //   if (user) {
    //     this.userDetails = user;
    //     console.log(this.userDetails);
    //   } else {
    //     this.userDetails = null;
    //   }
    // });
  }

  loginWithGoogle(): Observable<any> {
    return Observable.fromPromise(
      this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
    );
  }

  loginWithFacebook(): Observable<any> {
    return Observable.fromPromise(
      this.afAuth.auth.signInWithPopup(new firebase.auth.FacebookAuthProvider())
    );
  }

  login(email, password): Observable<any> {
    return Observable.fromPromise(
      this.afAuth.auth.signInWithEmailAndPassword(email, password)
    );
  }

  isAuthentificates(): Observable<boolean> {
    return this.user.map(user => user && user.uid !== undefined);
  }

  logout() {
    this.afAuth.auth.signOut();
  }

  getUser() {
    return {
      name: this.userDetails.displayName,
      email: this.userDetails.email
    };
  }

}
