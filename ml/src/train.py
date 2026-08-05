import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import os

# Import our cleaning and feature engineering functions
from cleaning import clean_data
from feature_engineering import feature_engineer

def train_model():
    """
    Loads data, performs cleaning and feature engineering, splits data,
    trains a RandomForestRegressor model, and saves the model.
    """
    print("\n--- Model Training ---")
    
    # Define the path to the dataset
    data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'cholera_dataset.csv')
    
    # Load the dataset
    df = pd.read_csv(data_path)
    print("Dataset loaded successfully.")
    
    # Apply cleaning
    df_cleaned = clean_data(df)
    
    # Apply feature engineering
    df_engineered = feature_engineer(df_cleaned)
    
    # Define features (X) and target (y)
    # We are predicting 'cholera' cases
    X = df_engineered.drop(columns=['cholera'])
    y = df_engineered['cholera']
    
    print(f"Features (X) shape: {X.shape}")
    print(f"Target (y) shape: {y.shape}")
    
    # Split data into training and testing sets
    # Using a fixed random_state for reproducibility
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    print(f"Data split: Training samples = {len(X_train)}, Testing samples = {len(X_test)}")
    
    # Initialize and train the model
    # RandomForestRegressor is a good choice for its robustness and ability to handle non-linear relationships
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    print("Training RandomForestRegressor model...")
    model.fit(X_train, y_train)
    print("Model training complete.")
    
    # Save the trained model
    model_output_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'cholera_model.joblib')
    joblib.dump(model, model_output_path)
    print(f"Trained model saved to: {model_output_path}")
    
    # For immediate evaluation (will be moved to evaluate.py later)
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print("\n--- Initial Model Evaluation (on test set) ---")
    print(f"Mean Absolute Error (MAE): {mae:.2f}")
    print(f"Mean Squared Error (MSE): {mse:.2f}")
    print(f"R-squared (R2): {r2:.2f}")
    
    return model, X_test, y_test

if __name__ == "__main__":
    train_model()
